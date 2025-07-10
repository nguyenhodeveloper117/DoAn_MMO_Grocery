use mmodb;
-- 1. Tạo Admin
INSERT INTO user (
    user_code, username, password, role, avatar, balance, is_staff, is_superuser, is_active, date_joined
) VALUES (
    'AD001', 'admin',
    'pbkdf2_sha256$600000$example_admin_hash', -- đổi thành hash thật
    'admin',
    'https://res.cloudinary.com/dnwyvuqej/image/upload/v1733499646/default_avatar_uv0h7z.jpg',
    0, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP
);

-- 2. Tạo Người bán
INSERT INTO user (
    user_code, username, password, role, avatar, balance, is_active, date_joined
) VALUES (
    'SE001', 'seller1',
    'pbkdf2_sha256$600000$example_seller_hash',
    'seller',
    'https://res.cloudinary.com/dnwyvuqej/image/upload/v1733499646/default_avatar_uv0h7z.jpg',
    0, TRUE, CURRENT_TIMESTAMP
);

-- 3. Tạo Người mua
INSERT INTO user (
    user_code, username, password, role, avatar, balance, is_active, date_joined
) VALUES (
    'CU001', 'buyer1',
    'pbkdf2_sha256$600000$example_buyer_hash',
    'customer',
    'https://res.cloudinary.com/dnwyvuqej/image/upload/v1733499646/default_avatar_uv0h7z.jpg',
    1000000, TRUE, CURRENT_TIMESTAMP
);

-- 4. Tạo gian hàng
INSERT INTO store (
    store_code, seller_id, name, description, verified, created_date, updated_date
) VALUES (
    'ST001', 'SE001', 'Shop Pro', 'Chuyên bán acc game VIP', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 5. Tạo sản phẩm
INSERT INTO product (
    product_code, store_id, name, image, description, price, format, type, warranty_days, is_approved,
    created_date, updated_date
) VALUES (
    'PR001', 'ST001', 'Acc Liên Quân Cao Thủ',
    'https://link.to.image.jpg',
    'Tài khoản có 100 skin + Rank Cao Thủ',
    500000, 'TK|MK', 'account', 7, TRUE,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 6. Tạo kho tài khoản
INSERT INTO accountstock (
    stock_code, product_id, content, is_sold, created_date, updated_date
) VALUES
('AS001', 'PR001', 'user1|pass1', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('AS002', 'PR001', 'user2|pass2', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('AS003', 'PR001', 'user3|pass3', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 7. Tạo voucher
INSERT INTO voucher (
    voucher_code, store_id, code, discount_percent, max_discount, expired_at, quantity,
    created_date, updated_date
) VALUES (
    'VC001', 'ST001', 'GIAM10', 10, 100000, DATE('now', '+7 days'), 50,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 8. Tạo đơn hàng
INSERT INTO "order" (
    order_code, buyer_id, voucher_id, discount_amount, total_amount,
    is_paid, status, released_at, created_date, updated_date
) VALUES (
    'OD001', 'CU001', 'VC001', 50000, 450000,
    TRUE, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 9. Tạo chi tiết đơn hàng
INSERT INTO accorderdetail (
    acc_order_detail_code, order_id, product_id, quantity, content_delivered,
    created_date, updated_date
) VALUES (
    'ADD001', 'OD001', 'PR001', 1, 'user1|pass1',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 10. Ghi lịch sử giao dịch
INSERT INTO transactionhistory (
    transaction_code, user_id, type, amount, note,
    created_date, updated_date
) VALUES (
    'TX001', 'CU001', 'purchase', 450000, 'Mua tài khoản PR001',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

INSERT INTO transactionhistory (
    transaction_code, user_id, type, amount, note,
    created_date, updated_date
) VALUES (
    'TX002', 'SE001', 'receive', 450000, 'Nhận tiền từ đơn hàng OD001',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
