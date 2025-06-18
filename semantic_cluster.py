from typing import List
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import torch
import random
from config import model, tokenizer


def embed_manual(texts):
    inputs = tokenizer(texts, return_tensors="pt", padding=True, truncation=True)
    with torch.no_grad():
        outputs = model(**inputs)
    embeddings = outputs.last_hidden_state[:, 0, :]
    return torch.nn.functional.normalize(embeddings, p=2, dim=1).cpu().numpy()


def score_cluster(embeddings):
    cluster_center = np.mean(embeddings, axis=0, keepdims=True)
    sims = cosine_similarity(embeddings, cluster_center)
    return np.mean(sims)


def select_top_k_chunks(cluster_chunks, cluster_embeds, k=3):
    center = np.mean(cluster_embeds, axis=0, keepdims=True)
    sims = cosine_similarity(cluster_embeds, center).flatten()
    top_indices = np.argsort(sims)[-k:]
    return "\n\n".join([cluster_chunks[i].page_content for i in top_indices])


def retrieve_diverse_chunks(chunks: List, k: int = 5) -> List:
    contents = [chunk.page_content for chunk in chunks if len(chunk.page_content.split()) > 10]
    chunks = [chunk for chunk in chunks if len(chunk.page_content.split()) > 10]
    embeddings = embed_manual(contents)

    k = min(k, len(chunks))
    kmeans = KMeans(n_clusters=k, random_state=42, n_init="auto")
    labels = kmeans.fit_predict(embeddings)

    diverse_chunks = []
    for label in set(labels):
        cluster_chunks = [chunks[i] for i in range(len(chunks)) if labels[i] == label]
        cluster_embeds = [embeddings[i] for i in range(len(chunks)) if labels[i] == label]

        if score_cluster(cluster_embeds) > 0.55:
            merged_chunk = select_top_k_chunks(cluster_chunks, cluster_embeds, k=3)
            if merged_chunk.strip().isdigit() or len(merged_chunk.split()) < 20:
                print(f"🛑 Skipping cluster {label}: weak or too short content")
                continue
            diverse_chunks.append(merged_chunk)
        else:
            print(f"⚠️ Skipping low-coherence cluster {label}")

    return diverse_chunks
