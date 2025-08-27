# MMO/signals.py
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings

from .models import AccOrderDetail, ServiceOrderDetail, Order

logger = logging.getLogger(__name__)


def _send_order_email_for_seller(order: Order):
    """
    Gửi email cho seller dựa trên order đã có detail (acc_detail hoặc service_detail).
    Gọi từ transaction.on_commit để đảm bảo dữ liệu đã commit.
    """
    try:
        seller = None
        detail = None

        if hasattr(order, "acc_detail") and order.acc_detail and order.acc_detail.product:
            detail = order.acc_detail
            seller = detail.product.store.seller
            detail_kind = "acc"
        elif hasattr(order, "service_detail") and order.service_detail and order.service_detail.product:
            detail = order.service_detail
            seller = detail.product.store.seller
            detail_kind = "service"
        else:
            logger.warning("No order detail for order %s - skip sending email", order.order_code)
            return

        if not seller or not getattr(seller, "email", None):
            logger.warning("No seller/email for order %s - skip sending email", order.order_code)
            return

        subject = f"[Đơn hàng mới - MMOApp] {order.order_code}"
        body_lines = [
            f"Xin chào {getattr(seller, 'username', seller.user_code)}",
            "",
            f"Bạn có 1 đơn hàng mới: {order.order_code}",
            f"Người mua: {order.buyer.username}",
            f"Trạng thái: {order.status}",
            f"Thời gian: {order.created_date}",
            "",
        ]

        if detail_kind == "acc":
            body_lines += [
                f"Sản phẩm: {detail.product.name if detail.product else 'N/A'}",
                f"Số lượng: {detail.quantity}",
                f"Tổng: {detail.total_amount} đ",
                f"Nội dung đã giao: {detail.content_delivered or 'N/A'}",
            ]
        else:  # service
            body_lines += [
                f"Sản phẩm (dịch vụ): {detail.product.name if detail.product else 'N/A'}",
                f"Số lượng: {detail.quantity}",
                f"Target URL: {getattr(detail, 'target_url', '')}",
                f"Tổng: {detail.total_amount} đ",
                f"Trạng thái chi tiết: {detail.status}",
            ]

        body_lines += ["", "Truy cập dashboard để xem chi tiết."]

        message = "\n".join(body_lines)

        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [seller.email],
            fail_silently=False,
        )
        logger.info("Order email sent: %s -> %s", order.order_code, seller.email)

        # Nếu bạn có field order.seller_notified (tuỳ chọn), đặt flag để tránh gửi trùng:
        try:
            if hasattr(order, "seller_notified") and not order.seller_notified:
                order.seller_notified = True
                order.save(update_fields=["seller_notified"])
        except Exception:
            logger.exception("Unable to set seller_notified for order %s", order.order_code)

    except Exception as exc:
        logger.exception("Failed to send order email for %s: %s", getattr(order, "order_code", "N/A"), exc)


@receiver(post_save, sender=AccOrderDetail)
def acc_order_detail_created(sender, instance: AccOrderDetail, created, **kwargs):
    if not created:
        return
    order = instance.order
    # gửi sau khi transaction commit
    transaction.on_commit(lambda: _send_order_email_for_seller(order))


@receiver(post_save, sender=ServiceOrderDetail)
def service_order_detail_created(sender, instance: ServiceOrderDetail, created, **kwargs):
    if not created:
        return
    order = instance.order
    # gửi sau khi transaction commit
    transaction.on_commit(lambda: _send_order_email_for_seller(order))
