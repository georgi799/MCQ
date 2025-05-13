from uploader import save_uploaded_file
from chunk_files import load_and_split_pdfs
from embedder import store_embeddings
from rag import setup_rag

import sys

def run_pipeline(pdf_paths, user_query):
    print(f"\n Loading document: {pdf_paths}")
    chunks = load_and_split_pdfs(pdf_paths)

    if not chunks:
        print("No chunks found in the document.")
        return

    print(f" Chunks ready for embedding: {len(chunks)}")
    print("Generating embeddings and storing in vector DB...")
    vectorstore = store_embeddings(chunks)

    print("Setting up RAG chain...")
    qa_chain = setup_rag(vectorstore)

    print("\n Original Query:", user_query)
    print("Invoking QA Chain...\n")
    answer = qa_chain.invoke(query)
    print("\n Final Answer:", answer)

if __name__ == "__main__":
    pdf_paths = [
        "example_data/SI_Curs1.pdf",
        "example_data/ComputerScienceOne.pdf",
        "example_data/DataStructures.pdf",
        "example_data/NetworkingFundamentals.pdf",
        "example_data/Verilog.pdf",
    ]
    query = "crocodil. Keep in mind the document will also be in Romanian, please answer in English but parse the Romanian text."

    if len(sys.argv) > 2:
        test_file_path = sys.argv[1]
        query = " ".join(sys.argv[2:])

    run_pipeline(pdf_paths, query)
