# ROCm Deployment Guide (AMD Developer Cloud)

This guide provides step-by-step instructions on how to set up the **AMD Developer Cloud** to run the Agentic Pipeline for **Context Relay**. 

To satisfy the hackathon requirements for running on AMD hardware, we use **vLLM compiled for ROCm** to serve both the embedding model (for Retrieval) and the fast generative model (for Local/Fast Routing).

---

## Step 1: Provision an AMD Developer Cloud Instance

If you are not familiar with the AMD Developer Cloud, follow these steps to get a server running:

1. Go to the [AMD Developer Cloud Portal](https://aac.amd.com/) and log in.
2. Navigate to the **Workloads** or **Instances** section and click **Deploy New Instance** (or similar).
3. Select an instance with an AMD Instinct GPU. For this project, an instance with **MI210**, **MI250**, or **MI300X** accelerators is recommended.
4. For the Operating System, select **Ubuntu 22.04** (this is the most stable version for ROCm Docker containers).
5. Ensure you add your SSH key so you can connect to the instance.
6. Launch the instance. Once it is running, note the **Public IP Address** provided in the dashboard.

## Step 2: Connect to the Instance

Open your local terminal (Command Prompt, PowerShell, or macOS/Linux Terminal) and connect to your new AMD instance via SSH:

```bash
ssh ubuntu@<YOUR_INSTANCE_PUBLIC_IP>
```
*(Replace `<YOUR_INSTANCE_PUBLIC_IP>` with the actual IP address from the AMD dashboard).*

Once logged in, verify that the AMD GPUs are correctly recognized by running:
```bash
rocm-smi
```
*You should see a table listing your AMD GPUs and their current status.*

## Step 3: Deploy the Generative Model (Fast Local Tier)

We will run a lightweight, blazing-fast model (`google/gemma-2-9b-it`) using the official ROCm vLLM Docker container. 

Run this exact command in your SSH terminal:

```bash
sudo docker run -d --name vllm-amd-generative \
  --network host \
  --device /dev/kfd --device /dev/dri \
  -v /home/ubuntu/.cache/huggingface:/root/.cache/huggingface \
  rocm/vllm:rocm6.1_ubuntu22.04_py3.10_vllm_0.5.0 \
  --model google/gemma-2-9b-it \
  --port 8001 \
  --max-model-len 4096
```

*Note: The `-d` flag runs this in the background. It may take a few minutes to download the large container image and the model weights.*

## Step 4: Deploy the Embedding Model (Retrieval Step)

Next, we will run an embedding model (`BAAI/bge-large-en-v1.5`) which the Agentic Pipeline uses to search and rank your context chunks.

Run this command in the same SSH terminal:

```bash
sudo docker run -d --name tei-amd-embedding \
  --network host \
  --device /dev/kfd --device /dev/dri \
  -v /home/ubuntu/.cache/huggingface:/root/.cache/huggingface \
  ghcr.io/huggingface/text-embeddings-inference:rocm \
  --model-id BAAI/bge-large-en-v1.5 \
  --port 8002
```

## Step 5: Verify the Containers are Running

To ensure both models successfully started, run:
```bash
sudo docker ps
```
You should see both `vllm-amd-generative` and `tei-amd-embedding` listed as "Up".

*(Optional)* You can view the logs of the Gemma model booting up by running:
```bash
sudo docker logs -f vllm-amd-generative
```
*(Press `Ctrl+C` to exit the logs view).*

## Step 6: Connect Your Backend to the AMD Hardware

Now that the AMD server is running the AI models, you need to tell your Context Relay backend how to communicate with it.

1. Open the `.env` file in your `backend/` folder (or your Render dashboard environment variables).
2. Update the URLs to point to the **Public IP Address** of your AMD instance.

```env
# AMD Generative Model (Local Tier)
AMD_LLM_URL=http://<YOUR_INSTANCE_PUBLIC_IP>:8001/v1/chat/completions
AMD_LLM_API_KEY=optional_key
AMD_LLM_MODEL=google/gemma-2-9b-it

# AMD Embedding Model (Retrieve Step)
AMD_EMBEDDING_URL=http://<YOUR_INSTANCE_PUBLIC_IP>:8002/v1/embeddings
AMD_EMBEDDING_API_KEY=optional_key
AMD_EMBEDDING_MODEL=BAAI/bge-large-en-v1.5

# Fireworks AI (Cloud Tier & Synthesize Step)
FIREWORKS_API_KEY=your_fireworks_key
```

### You're Done!
Your Context Relay backend will now natively route embedding and generation requests directly to your AMD hardware, fulfilling the hackathon requirements!
