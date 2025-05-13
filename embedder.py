from langchain_ollama import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

def store_embeddings(chunks, collection_name="user_docs"):
    embedding_function = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embedding_function,
        collection_name=collection_name
    )
    return vectorstore