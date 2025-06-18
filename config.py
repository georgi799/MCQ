from transformers import AutoTokenizer, AutoModel
from keybert import KeyBERT
import torch

MODEL_NAME = "intfloat/multilingual-e5-large"

from langchain_huggingface import HuggingFaceEmbeddings
embedding_model = HuggingFaceEmbeddings(
    model_name=MODEL_NAME,
    encode_kwargs={"normalize_embeddings": True}
)

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModel.from_pretrained(MODEL_NAME)
model.eval()

kw_model = KeyBERT(model=model)
