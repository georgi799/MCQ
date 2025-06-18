from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

def store_embeddings(chunks, collection_name="user_docs"):
    embedding_function = HuggingFaceEmbeddings(
        model_name="intfloat/multilingual-e5-large",
        encode_kwargs = {"normalize_embeddings": True}
    )
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embedding_function,
        collection_name=collection_name
    )
    return vectorstore