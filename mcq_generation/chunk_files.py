from langchain_community.document_loaders import PyPDFLoader
from langdetect import detect, LangDetectException
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_experimental.text_splitter import SemanticChunker

def load_and_split_pdfs(file_paths, chunk_size=1000, chunk_overlap=200):
    all_chunks= []

    embedding_model = HuggingFaceEmbeddings(
        model_name="intfloat/multilingual-e5-large",
        encode_kwargs = {"normalize_embeddings": True}
    )

    chunker = SemanticChunker(
        embeddings=embedding_model,
        breakpoint_threshold_type="interquartile",
        breakpoint_threshold_amount=85,
    )

    for file_path in file_paths:
     try:
        loader = PyPDFLoader(file_path)
        documents = loader.load()

        chunks = chunker.split_documents(documents)

        for chunk in chunks:
            text = chunk.page_content.strip()
            if len(text) > 20:
                try:
                    chunk.metadata["language"] = detect(text)
                except LangDetectException:
                    chunk.metadata["language"] = "unknown"
            else:
                chunk.metadata["language"] = "unknown"
            chunk.metadata["source_file"] = file_path

        all_chunks.extend(chunks)

     except Exception as e:
        print(f"Error loading {file_path}: {e}")
        continue

    return all_chunks
