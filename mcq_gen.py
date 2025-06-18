import re
import os
import json
from semantic_cluster import retrieve_diverse_chunks
from chunk_files import load_and_split_pdfs
from embedder import store_embeddings
from langchain_core.prompts import PromptTemplate
from langchain.schema import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_ollama import OllamaLLM
from keybert import KeyBERT
from config import kw_model
import time
import tiktoken

ENCODING = tiktoken.encoding_for_model("gpt-3.5-turbo")

def count_tokens(text: str) -> int:
    return len(ENCODING.encode(text))

total_tokens_used = 0

os.environ["GOOGLE_API_KEY"] = "AIzaSyChXadHTAjLRk81ktugkgZ4qucD-_l6lhU"
llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.2)
# llm = OllamaLLM(model="llama3", temperature=0.2)

parser = StrOutputParser()

self_refine_prompt = PromptTemplate(
    input_variables=["context"],
    template="""
Given the following university course content, generate a high-quality multiple-choice question.

Steps:
1. Create a clear and pedagogically relevant MCQ stem (question).
2. Provide the correct answer.
3. Evaluate your own question (too easy? unclear?).
4. Improve the question accordingly.

Avoid rephrasing existing questions on the same topic. Focus on unique, non-redundant concepts drawn from the context.
Try to cover under-assessed or deeper understanding concepts if possible.

Respond using the following format:
STEM: <initial question>
ANSWER: <correct answer>
CRITIQUE: <evaluation>
IMPROVED: <better version>

Context:
{context}
"""
)

cot_prompt = PromptTemplate(
    input_variables=["revised"],
    template="""
Given the revised MCQ below, generate 3 incorrect options (distractors) that are plausible but incorrect.

Then return the final MCQ in this **required JSON format**:
{{
  "stem": "<revised STEM here>",
  "key": "<correct answer>",
  "distractors": ["...", "...", "..."]
}}

Do not add explanations or additional commentary.
All fields must be present and filled.

Revised MCQ:
{revised}
"""
)

self_refine_chain = self_refine_prompt | llm | parser
cot_chain = cot_prompt | llm | parser

def extract_last_improved_mcq(raw_output):
    lines = raw_output.splitlines()
    all_blocks = []
    current_block = []
    capture = False

    for line in lines:
        if line.strip().startswith("IMPROVED:"):
            if current_block:
                all_blocks.append("\n".join(current_block).strip())
                current_block = []
            capture = True
            continue
        if capture:
            if line.strip().startswith("CRITIQUE:") and current_block:
                continue
            current_block.append(line)

    if current_block:
        all_blocks.append("\n".join(current_block).strip())

    return all_blocks[-1] if all_blocks else None

def extract_json_block(text):
    match = re.search(r"\{.*?\}", text, re.DOTALL)
    if match:
        try:
            parsed = json.loads(match.group())
            required_fields = ["stem", "key", "distractors"]
            for field in required_fields:
                if field not in parsed or not parsed[field]:
                    print(f" Missing field: {field}")
                    return None
            return parsed
        except json.JSONDecodeError as e:
            print(" JSON found but not valid:", e)
    return None

def extract_topic_label(text: str) -> str:
    keywords = kw_model.extract_keywords(
        text,
        keyphrase_ngram_range=(1, 2),
        stop_words="english",
        top_n=1
    )
    return keywords[0][0] if keywords else "Unknown"

def generate_mcq(context):
    global total_tokens_used

    prompt_tokens = count_tokens(context)
    raw_output = self_refine_chain.invoke({"context": context})
    response_tokens_1 = count_tokens(raw_output)
    print("\n RAW OUTPUT FROM SELF-REFINE:\n", raw_output)
    print(f" Tokens - Prompt: {prompt_tokens} | Response (Self-Refine): {response_tokens_1}")

    improved = extract_last_improved_mcq(raw_output)
    if not improved:
        print(" Could not extract improved MCQ.")
        return None

    cot_input_tokens = count_tokens(improved)
    final_mcq = cot_chain.invoke({"revised": improved})
    response_tokens_2 = count_tokens(final_mcq)
    print(f" Tokens - Prompt (CoT): {cot_input_tokens} | Response (Final MCQ): {response_tokens_2}")

    total = prompt_tokens + response_tokens_1 + cot_input_tokens + response_tokens_2
    total_tokens_used += total
    print(f" Total tokens used for this MCQ: {total} | Cumulative: {total_tokens_used}")

    parsed = extract_json_block(final_mcq)
    return parsed

def retrieve_mcqs_from_seed_queries(retriever, k=5):
    seed_queries = [
        "Give a testable concept from this course.",
        "Extract a core principle of this subject.",
        "Describe a function from a key component.",
        "Summarize an important memory concept.",
        "What is a common architecture topic?",
    ]
    contexts = []
    for query in seed_queries[:k]:
        docs = retriever.invoke(query)
        context = "\n\n".join([doc.page_content for doc in docs])
        contexts.append(context)
    return contexts

if __name__ == "__main__":
    pdfs = [
        #"example_data/SI_Curs1.pdf",
        #"example_data/SI_Curs2.pdf"
        #"example_data/RC_Curs11.pdf",
        #"example_data/Crypto.pdf",
        #"example_data/SoftwareSecurity1.pdf",
        "example_data/Csharp.pdf",
    ]

    print(" Loading and splitting PDFs...")
    chunks = load_and_split_pdfs(pdfs)
    clustered_contexts = retrieve_diverse_chunks(chunks, k=8)

    vectorstore = store_embeddings(chunks)
    retriever = vectorstore.as_retriever(search_type="mmr", search_kwargs={"k": 10})

    all_mcqs = []
    for i, context in enumerate(clustered_contexts):
        topic = extract_topic_label(context)
        print(f" Cluster {i + 1} Topic: {topic}")
        mcq = generate_mcq(context)
        time.sleep(3 + i * 0.5)
        if mcq:
            mcq["source"] = "cluster"
            all_mcqs.append(mcq)

    # Fallback using seed queries if needed
    if len(all_mcqs) < 5:
        print(f" Only {len(all_mcqs)} MCQs from clustering — using seed query fallback...")
        fallback_contexts = retrieve_mcqs_from_seed_queries(retriever, k=5 - len(all_mcqs))
        for ctx in fallback_contexts:
            mcq = generate_mcq(ctx)
            if mcq:
                mcq["source"] = "retriever"
                all_mcqs.append(mcq)

    if all_mcqs:
        with open("generated_mcqs.json", "w", encoding="utf-8") as f:
            json.dump(all_mcqs, f, indent=4, ensure_ascii=False)
        print(f" {len(all_mcqs)} MCQs saved to generated_mcqs.json")
    else:
        print("No MCQs were generated.")
