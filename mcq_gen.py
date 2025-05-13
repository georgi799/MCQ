from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains.llm import LLMChain
from langchain.chains.sequential import SequentialChain
from langchain_community.llms.llamacpp import LlamaCpp
from langchain_core.prompts import ChatPromptTemplate
from langchain.prompts import PromptTemplate
from langchain_community.llms import Ollama
from langchain_ollama import OllamaLLM as Ollama
from langchain_core.runnables import RunnableSequence, RunnablePassthrough
import os
import json
from typing import Dict
from langchain_core.runnables import RunnableLambda

from langchain_ollama import ChatOllama

with open(r"C:\Users\georg_r1r2xai\OneDrive\Desktop\MCQ\quiz_template.json") as f: quiz_template = json.load(f)

llm = Ollama(
    model = "llama3",
    temperature = 0.7
)

initial_prompt = """
You are a Multiple-Choice Question generator helping students learn their course material better. Your job is to test
 students' knowledge by creating multiple-choice questions (MCQs) based on the provided text {text}.
 Create {numbers} multiple-choice questions for students that are undergraduate-level.
 The questions must include topics and concepts from the provided document {text}, focusing on learning outcomes.
 The questions must have 4 alternatives: one correct answer and three incorrect answers.
 Follow these guidelines to write the stems of the questions: the stem addresses one single learning outcome, uses clear
 and concise wording, and avoids negative phrases and ambiguous vocabulary.
 Follow these guidelines to write the alternatives: all alternatives must be plausible answers, have a similar length, be parallel in
grammatical form, and avoid repeating phrases or words from the stem. Also alternatives should not include obviously
wrong answers, \"All of the above\" or \"None of the above\".
The quiz must follow this template: {quiz_template}
"""

generate_stem_and_key = """
Generate a stem and key for a for a Multiple-Choice Question (MCQ) based on the provided text {text}. Follow the format:

Stem: [Insert Topic-Related-Question]
Key: [Insert Correct Answer]
"""

suggest_difficulty_enhancement = """
Given the MCQ stem and key, provide one suggestion to increase the difficulty without altering the correct answer.

Question: [Stem]
Correct Answer: [Key]
Suggestion: [Provide suggestion to increase difficulty]
"""

apply_difficulty_enhancement = """
Integrate the difficulty enhancement suggestion into the MCQ. Ensure the stem reflects the increased difficulty.

Original Question: [Stem]: [Key]
Suggestion: [Suggestion]
New Question: [Revised Stem]: [Key]
"""

def self_refine(text, iterations=2):
    intial_output = text | llm
    


# system_prompt = """
#     Create {numbers} MCQs from this exact document:
# {text}
# STRICT REQUIREMENTS:
# 1. Use ONLY this JSON format (maintain all fields exactly):
# {quiz_template}
#
# Guidelines:
# - Format exactly like: {quiz_template}
# - Only use concepts actually mentioned in the text
# - For each question:
# - 1 correct answer
# - 3 plausible incorrect answers
# - Brief feedback on each option
# """
#
# quiz_generation_prompt = PromptTemplate(
#     input_variables= ["text", "numbers", "tone" ,"quiz_template"],
#     template = system_prompt
# )
#
# quiz_chain = quiz_generation_prompt | llm
#
# review_template = """
# Analyze ONLY these actual questions:
# {quiz}
#
# Provide:
# 1. Complexity rating (1-10) for each
# 2. 2 specific strengths
# 3. 2 specific weaknesses
# 4. 1 concrete improvement suggestion
#
# Do NOT analyze hypothetical questions.
# """
#
# quiz_evaluation_prompt = PromptTemplate(
#     input_variables= ["quiz"],
#     template = review_template
# )
#
#
# def generate_and_evaluate(inputs: Dict) -> Dict:
#     # Generate quiz
#     quiz = quiz_chain.invoke(inputs)
#
#     # Evaluate quiz
#     review = review_chain.invoke({"quiz": quiz})
#
#     return {"quiz": quiz, "review": review}
#
#
# review_chain = quiz_evaluation_prompt | llm
#
# generate_evaluate_chain = (
#     RunnablePassthrough.assign(quiz=quiz_chain)
#     | {
#         "quiz": RunnablePassthrough(),  # Pass through the quiz
#         "review": lambda x: review_chain.invoke({"quiz": x["quiz"]})
#     }
# )
#
#
