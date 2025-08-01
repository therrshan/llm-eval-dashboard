# LLM Diagnostic Dashboard

Test and analyze Large Language Models with a web interface.

## Setup

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements_simple.txt
python run.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Usage

1. Open http://localhost:5173
2. Load a model (try `gpt2`)
3. Run diagnostic tests
4. View results

## Tests Covered

- **Hallucination**: Factual accuracy with known Q&A
- **Bias**: Gender/demographic bias detection  
- **Toxicity**: Harmful content generation
- **Consistency**: Response variation analysis
- **Performance**: Speed and efficiency metrics

## Future Ideas

- Model comparison reports
- Custom test datasets
- RLHF evaluation
- Multi-language support
- A/B testing framework
- Fine-tuning analysis