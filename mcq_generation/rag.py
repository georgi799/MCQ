from langchain_core.prompts import ChatPromptTemplate, PromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableMap
from langchain.schema import StrOutputParser
from langchain.chains import RetrievalQA
from langchain_ollama import OllamaLLM
from langchain_google_genai import ChatGoogleGenerativeAI
import os
from dotenv import load_dotenv


load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY

prompt_rewrite = PromptTemplate(
        input_variables=["query"],
        template="""
       You are a multilingual query rewriting assistant. The user's question is in English, but documents may include Romanian or Latin-based terminology.

Rewrite the question using multilingual synonyms and related domain terminology to increase semantic matching in academic or technical contexts.

Maintain the original meaning. Do NOT change question scope or introduce new interpretations.

Original Question:
{query}

Rewritten Technical Query:
        """
    )

react_prompt = PromptTemplate(
        input_variables=["context", "query"],
        template="""
  You are a helpful AI tutor. The student's question is in English. The source documents may include Romanian, French, or Latin-derived academic terms.

Use only the information in the context to answer. Be accurate, concise, and field-agnostic.

Guidelines:
- Never fabricate instruction syntax, register behavior, protocol rules, or hardware features.
- Only describe performance advantages if they are explicitly stated in the document, or can be cautiously inferred from examples within the context (e.g., divide-and-conquer patterns).
- If the document does not provide a direct answer, but related examples or descriptions exist, use them cautiously to illustrate the concept.
- Only answer confidently if supported by terms or examples found in the document.
- Always answer in educational English using examples or terminology found in the source.
- Do not introduce advanced data structures (e.g., trees, graphs, suffix arrays) unless they are present in the source context.
- You may cautiously compare data structures if they are both defined in the context, even if tradeoffs are not explicitly stated.

Context:
{context}

Question:
{query}

Answer:
    """
    )


def setup_rag(vectorstore):
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0.2,
        max_output_tokens=1024
    )

    retriever = vectorstore.as_retriever(search_type="mmr", search_kwargs={"k": 10, "fetch_k": 20})

    rewrite_chain = prompt_rewrite | llm | StrOutputParser()
    answer_chain = react_prompt | llm | StrOutputParser()

    full_chain = (
    {"query": RunnablePassthrough()}
    | RunnableMap({"query": rewrite_chain})
    | (lambda rewritten: (
        print(f"Rewritten Query: \n {repr(rewritten['query'])}\n"),
        {
        "query": rewritten["query"],
        "context": "\n\n".join([doc.page_content for doc in retriever.invoke(rewritten["query"])])
        }
    )[1])
    | answer_chain
)

    return full_chain

def retrieve_relevant_chunks(query, vectorstore, top_k=3):

    retriever = vectorstore.as_retriever(search_type="mmr", search_kwargs={"k": top_k, "fetch_k": 2*top_k})
    docs = retriever.invoke(query)
    return [doc.page_content for doc in docs]