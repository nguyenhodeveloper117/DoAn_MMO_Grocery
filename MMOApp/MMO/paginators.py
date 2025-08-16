from rest_framework import pagination

class ProductPaginator(pagination.PageNumberPagination):
    page_size = 5

class BlogPaginator(pagination.PageNumberPagination):
    page_size = 5

class BlogCommentPaginator(pagination.PageNumberPagination):
    page_size = 5

class StockPaginator(pagination.PageNumberPagination):
    page_size = 5

class OderPaginator(pagination.PageNumberPagination):
    page_size = 5