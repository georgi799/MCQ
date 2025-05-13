from langchain.chains.llm import LLMChain
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.prompts import ChatPromptTemplate, PromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableMap
from langchain_ollama import ChatOllama
from langchain.schema import StrOutputParser
from langchain_chroma import Chroma
from langchain_community.embeddings import LlamaCppEmbeddings
from langchain.chains import RetrievalQA
from langchain_community.llms import LlamaCpp
from langchain_ollama import OllamaLLM


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
- If the context does not explicitly define a concept, say:
  "The document does not explicitly define '{query}', but related terms include..."
- Avoid confident answers unless grounded in the context.
- Always answer in educational English.

Context:
{context}

Question:
{query}

Answer:
    """
    )


def setup_rag(vectorstore):
    llm = OllamaLLM(model="llama3", temperature=0.2)
    retriever = vectorstore.as_retriever(search_type="mmr", search_kwargs={"k": 5})

    rewrite_chain = prompt_rewrite | llm | StrOutputParser()
    answer_chain = react_prompt | llm | StrOutputParser()

    full_chain = (
    {"query": RunnablePassthrough()}
    | RunnableMap({"query": rewrite_chain})
    | (lambda rewritten: {
        "query": rewritten["query"],
        "context": "\n\n".join([doc.page_content for doc in retriever.invoke(rewritten["query"])])
    })
    | answer_chain
)

    return full_chain