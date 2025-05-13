from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langdetect import detect, LangDetectException


def load_and_split_pdfs(file_paths, chunk_size=1000, chunk_overlap=200):
    all_chunks= []

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ".", " ", ""]
    )

    for file_path in file_paths:
     try:
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        chunks = text_splitter.split_documents(documents)

        for chunk in chunks:
            if len(chunk.page_content.strip()) > 20:
                try:
                    chunk.metadata["language"] = detect(chunk.page_content)
                except LangDetectException:
                    chunk.metadata["language"] = "unknown"
            else:
                chunk.metadata["language"] = "unknown"
            chunk.metadata["source_file"] = file_path
        all_chunks.extend(chunks)

     except Exception as e:
        print(f"Error loading {file_paths}: {e}")
        continue

    return all_chunks
