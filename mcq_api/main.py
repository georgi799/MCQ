from fastapi import FastAPI, Form
import mysql.connector
import os
from dotenv import load_dotenv

app = FastAPI()
load_dotenv()

MYSQL_HOST = os.getenv("MYSQL_HOST")
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
MYSQL_DB = os.getenv("MYSQL_DB")
BASE_DIR = os.getenv("UPLOAD_DIR")


def get_file_path(material_id):

    print("Looking up material_id:", material_id)
    conn = mysql.connector.connect(
        user=MYSQL_USER, password=MYSQL_PASSWORD, host=MYSQL_HOST, database=MYSQL_DB
    )
    cursor = conn.cursor()
    cursor.execute("SELECT path FROM materials WHERE materialID = %s", (material_id,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()

    if result:
        rel_path = result[0]
        filename = os.path.basename(rel_path)
        abs_path = os.path.join(BASE_DIR, filename)
        return abs_path
    return None

def delete_old_quizzes(material_id):
    conn = mysql.connector.connect(
        user=MYSQL_USER, password=MYSQL_PASSWORD, host=MYSQL_HOST, database=MYSQL_DB
    )
    cursor = conn.cursor()
    cursor.execute("DELETE FROM quizzes WHERE materialID = %s", (material_id,))
    conn.commit()
    cursor.close()
    conn.close()

@app.post("/generate-mcqs/")
async def generate_mcqs(material_id: str = Form(...)):
    print("generate_mcqs endpoint called with material_id:", material_id)
    file_path = get_file_path(material_id)

    if not file_path or not os.path.isfile(file_path):
        return {"status": "error", "message": f"Material file not found at {file_path}."}

    delete_old_quizzes(material_id)

    from mcq_generation.semantic_cluster import retrieve_diverse_chunks
    from mcq_generation.chunk_files import load_and_split_pdfs
    from mcq_generation.mcq_gen import generate_mcq

    chunks = load_and_split_pdfs([file_path])
    clustered_contexts = retrieve_diverse_chunks(chunks, k=8)
    mcqs = []
    for context in clustered_contexts:
        mcq = generate_mcq(context)
        if mcq:
            save_mcq_to_db(mcq, material_id)
            mcqs.append(mcq)
    return {"status": "success", "mcqs_generated": len(mcqs)}

def save_mcq_to_db(mcq, material_id):
    import uuid
    import random
    conn = mysql.connector.connect(
        user=MYSQL_USER, password=MYSQL_PASSWORD, host=MYSQL_HOST, database=MYSQL_DB
    )
    cursor = conn.cursor()
    options = [mcq["key"]] + mcq.get("distractors", [])
    if len(options) != 4:
        return
    random.shuffle(options)
    correct_index = options.index(mcq["key"])
    correct_letter = ["A", "B", "C", "D"][correct_index]
    quiz_id = str(uuid.uuid4())
    cursor.execute(
        """
        INSERT INTO quizzes (quizId, materialID, question, optionA, optionB, optionC, optionD, correctOption)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            quiz_id,
            material_id,
            mcq.get("stem", ""),
            options[0],
            options[1],
            options[2],
            options[3],
            correct_letter
        )
    )
    conn.commit()
    cursor.close()
    conn.close()