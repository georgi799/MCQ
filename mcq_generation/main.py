from chunk_files import load_and_split_pdfs
from mcq_generation.embedder import store_embeddings
import sys

def run_pipeline(pdf_paths, user_query):
    print(f"\n Loading documents: {pdf_paths}")
    chunks = load_and_split_pdfs(pdf_paths)

    if not chunks:
        print(" No chunks found in the document.")
        return

    print(f" Chunks ready for embedding: {len(chunks)}")
    print("🔗 Generating embeddings and storing in vector DB...")
    vectorstore = store_embeddings(chunks)

    print(" Setting up RAG chain components...")

    from rag import prompt_rewrite, react_prompt, StrOutputParser, OllamaLLM
    #llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.2)
    llm = OllamaLLM(model = "llama3", temperature=0.2)
    rewrite_chain = prompt_rewrite | llm | StrOutputParser()
    answer_chain = react_prompt | llm | StrOutputParser()
    retriever = vectorstore.as_retriever(search_type="mmr", search_kwargs={"k": 10, "fetch_k": 20})

    print("\n Original Query:", user_query)


    rewritten_query = rewrite_chain.invoke(user_query)
    print(" Rewritten Query:\n", rewritten_query)


    retrieved_docs = retriever.invoke(rewritten_query)
    print("\n Retrieved Context (First 1000 chars):\n")
    print("\n".join([doc.page_content for doc in retrieved_docs])[:1000])

    print("\n Retrieved Chunk Metadata:")
    for i, doc in enumerate(retrieved_docs[:5]):
        meta = doc.metadata
        print(f"  {i+1}. Source: {meta.get('source_file', 'N/A')} | Language: {meta.get('language', 'N/A')}")


    context_text = "\n\n".join([doc.page_content for doc in retrieved_docs])
    final_answer = answer_chain.invoke({"query": rewritten_query, "context": context_text})
    print("\n Final Answer:\n", final_answer)


if __name__ == "__main__":
    pdf_paths = [
        "example_data/SI_Curs1.pdf",
        #"example_data/ComputerScienceOne.pdf",
        "example_data/SI_Curs2.pdf",
        "example_data/SI_Curs3.pdf",
        #"example_data/DataStructures.pdf",
        #"example_data/NetworkingFundamentals.pdf",
        #"example_data/Verilog.pdf",
    ]
    query = "Explain the role of the TMOD and TCON registers in the 8051 microcontroller’s timer/counter operations, including the significance of each bit. Keep in mind the document will also be in Romanian, please answer in English but parse the Romanian text."

    if len(sys.argv) > 2:
        test_file_path = sys.argv[1]
        query = " ".join(sys.argv[2:])

    run_pipeline(pdf_paths, query)
