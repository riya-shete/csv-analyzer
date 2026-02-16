# AI Usage & LLM Choice

## What I Used AI For

AI was used primarily as a development assistant, not as an autonomous decision-maker.

During development, AI helped with:

- Structuring the Django + React architecture
- Generating boilerplate code (models, views, serializers, components)
- Drafting Docker and deployment configuration
- Refining documentation and README
- Iterating on UI improvements

Inside the application, AI is used for:

- Generating structured insights from aggregated CSV statistics
- Answering follow-up questions about the uploaded dataset


## What I Verified and Implemented Myself

The following aspects were manually implemented, reviewed, and tested:

- CSV parsing using Pandas
- Statistical aggregation (mean, median, min, max, unique counts, distributions)
- Ensuring raw CSV data is **not** sent to the LLM
- Designing the aggregated-summary → LLM architecture
- Token payload size control and cost efficiency
- API request/response structure
- Docker build configuration
- Environment variable and API key handling
- LLM health check endpoint

All architectural and privacy decisions were intentional and manually validated.


## LLM Used in the Application

- **Model:** StepFun – Step-3.5-Flash  
- **Provider:** StepFun (via OpenRouter)


## Why Step-3.5-Flash Was Chosen

Step-3.5-Flash was selected after evaluating it against Llama 3.1 8B Instruct.

Key reasons:

- Larger parameter size (196B vs 8B) → stronger reasoning capability
- Better analytical and structured output quality
- Strong benchmark performance in reasoning-heavy tasks
- Multimodal support for future extensibility

Although it is more expensive per token, the application only sends aggregated statistical summaries (not raw CSV rows).  
This keeps token usage low while benefiting from higher-quality insight generation.


## Summary

AI was used to accelerate development and to power insight generation within the app.  
All data processing, architectural decisions, and privacy safeguards were manually designed and verified.  
Step-3.5-Flash via StepFun was chosen because its stronger reasoning capabilities produce higher-quality analytical insights for structured dataset interpretation.
