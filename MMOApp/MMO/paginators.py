from rest_framework import pagination

class ProductPaginator(pagination.PageNumberPagination):
    page_size = 10

class BlogPaginator(pagination.PageNumberPagination):
    page_size = 5

class BlogCommentPaginator(pagination.PageNumberPagination):
    page_size = 5