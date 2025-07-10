def generate_code(model, field_name: str, prefix: str, padding: int = 5):
    last_obj = model.objects.order_by(f'-{field_name}').first()
    if last_obj:
        try:
            last_id = int(getattr(last_obj, field_name)[len(prefix):])
        except:
            last_id = 0
    else:
        last_id = 0
    return f"{prefix}{last_id + 1:0{padding}d}"