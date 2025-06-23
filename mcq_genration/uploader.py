import os

def save_uploaded_file(file, upload_dir="example_data"):
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as f:
        f.write(file.read())
    return file_path