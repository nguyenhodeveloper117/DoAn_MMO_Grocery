import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd
from .models import Product, Order, FavoriteProduct, Review


def get_user_history(user):
    orders = Order.objects.filter(buyer=user, status='delivered').prefetch_related('acc_detail', 'service_detail')
    favorites = FavoriteProduct.objects.filter(user=user).values_list('product_id', flat=True)
    reviews = Review.objects.filter(buyer=user).values_list('product_id', flat=True)

    product_codes = set()
    for o in orders:
        if hasattr(o, 'acc_detail') and o.acc_detail.product:
            product_codes.add(o.acc_detail.product.product_code)
        if hasattr(o, 'service_detail') and o.service_detail.product:
            product_codes.add(o.service_detail.product.product_code)

    product_codes.update(favorites)
    product_codes.update(reviews)
    return list(product_codes)


def recommend_products(user, top_n=5):
    user_history = get_user_history(user)
    all_products = Product.objects.filter(is_approved=True)

    if not all_products.exists():
        return []

    # đổi 'id' -> 'product_code'
    df = pd.DataFrame(list(all_products.values('product_code', 'name', 'description', 'type')))

    # TF-IDF
    tfidf = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf.fit_transform(df['description'].fillna(''))  # phòng null

    # lấy index các sản phẩm user đã dùng
    user_indices = df[df['product_code'].isin(user_history)].index
    if not len(user_indices):
        return []  # user mới -> chưa có dữ liệu

    # lấy vector trung bình của các sản phẩm trong lịch sử
    user_vector = tfidf_matrix[user_indices].mean(axis=0)

    # ép về numpy array 2D
    user_vector = np.asarray(user_vector).reshape(1, -1)

    # tính cosine similarity
    cosine_sim = cosine_similarity(user_vector, tfidf_matrix).flatten()

    # gán similarity vào dataframe
    df['similarity'] = cosine_sim

    # lọc bỏ các sản phẩm đã mua/đánh giá/favorite
    recommendations = (
        df[~df['product_code'].isin(user_history)]
        .sort_values('similarity', ascending=False)
        .head(top_n)
    )

    return Product.objects.filter(product_code__in=recommendations['product_code'].tolist())
