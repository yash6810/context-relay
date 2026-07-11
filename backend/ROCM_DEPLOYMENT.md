# ROCm Deployment Guide (AMD Developer Cloud)

To satisfy the hackathon requirements for running on AMD hardware, we use **vLLM compiled for ROCm** to serve both the embedding model (for Retrieval) and the fast generative model (for Local/Fast Routing).

## 1. Environment Setup

Connect to your AMD Developer Cloud instance (e.g., equipped with MI210, MI250, or MI300X accelerators).

Verify ROCm is installed and GPUs are visible:
```bash
rocm-smi
```

## 2. Deploy the Generative Model (Fast Local Tier)
We will run a lightweight, blazing fast model (like `Qwen/Qwen2.5-7B-Instruct` or `google/gemma-2-9b-it`) using the official ROCm vLLM Docker container.

```bash
docker run -d --name vllm-amd-generative \
  --network host \
  --device /dev/kfd --device /dev/dri \
  -v /path/to/huggingface/cache:/root/.cache/huggingface \
  rocm/vllm:rocm6.1_ubuntu22.04_py3.10_vllm_0.5.0 \
  --model google/gemma-2-9b-it \
  --port 8001 \
  --max-model-len 4096
```

## 3. Deploy the Embedding Model (Retrieval Step)
We will run an embedding model (like `BAAI/bge-large-en-v1.5`) using Text Embeddings Inference (TEI) compiled for ROCm, or vLLM if configured for embeddings.

```bash
docker run -d --name tei-amd-embedding \
  --network host \
  --device /dev/kfd --device /dev/dri \
  -v /path/to/huggingface/cache:/root/.cache/huggingface \
  ghcr.io/huggingface/text-embeddings-inference:rocm \
  --model-id BAAI/bge-large-en-v1.5 \
  --port 8002
```

## 4. Backend Environment Variables
Update the `.env` file on the Render deployment (or local `.env`) to point to the public IPs of your AMD Developer Cloud instances:

```env
# AMD Generative Model (Local Tier)
AMD_LLM_URL=http://<AMD_INSTANCE_IP>:8001/v1/chat/completions
AMD_LLM_API_KEY=optional_key
AMD_LLM_MODEL=google/gemma-2-9b-it

# AMD Embedding Model (Retrieve Step)
AMD_EMBEDDING_URL=http://<AMD_INSTANCE_IP>:8002/v1/embeddings
AMD_EMBEDDING_API_KEY=optional_key
AMD_EMBEDDING_MODEL=BAAI/bge-large-en-v1.5

# Fireworks AI (Cloud Tier & Synthesize Step)
FIREWORKS_API_KEY=your_fireworks_key
```
