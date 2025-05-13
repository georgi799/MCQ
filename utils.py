import os
from PyPDF2 import PdfReader
import json
import traceback

def read_file(file):
    if file.endswith(".pdf"):
        try:
            pdf_reader = PdfReader(file)
            text =""
            for page in pdf_reader.pages:
                text+= page.extract_text() or ""
            return text

        except Exception as e:
            raise Exception("error reading pdf file")

    elif file.name.endswith(".txt"):
        return file.read().decode("utf-8")

    else:
        raise Exception("unsupported file type")

def get_table_data(quiz_str):
    try:
        quiz_dict = json.loads(quiz_str)
        quiz_table_data= []

        for key, value in  quiz_dict.items():
            mcq = value["MCQ"]
            options=" || ".join(
                [
                    f"{option} -> {option_value}" for option, option_value in value["Options"].items()
                ]
            )

            correct = value["Correct"]
            quiz_table_data.append({"MCQ": mcq, "Options": options, "Correct": correct})

        return quiz_table_data

    except Exception as e:
        traceback.print_exception(type(e), e, e.__traceback__)
        return False
