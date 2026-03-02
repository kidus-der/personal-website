---
title: "Can GPT-4o Spot a Deepfake? Benchmarking Multimodal LLMs on AI-Generated Content Detection"
description: We ran a systematic benchmark of multimodal LLMs on deepfake and AI-generated content detection. The results were more interesting — and more uneven — than expected.
publishedAt: "2026-01-20"
tags: ["Research", "LLMs", "Deepfakes", "AI Safety"]
draft: false
---

There's a tempting shortcut in AI-generated content detection: just ask a frontier model. GPT-4o, Claude 3.5, Gemini 1.5 Pro — these models have seen more data than any specialized detector, they can reason in natural language, and they've been trained with safety considerations in mind. Surely they can tell a real face from a generated one?

We decided to find out systematically.

## The Benchmark Design

We constructed an evaluation set spanning four categories of AI-generated content: face-swap deepfakes (FaceForensics++), full-face synthesis (StyleGAN, DALL-E 3), AI-generated text attributed to real people, and mixed-modality content (synthetic voice paired with real video). For each category, we included both high-quality and lower-quality examples, as well as SR-processed variants.

Prompting strategy matters enormously with these models, so we tested three prompt conditions: zero-shot binary classification ("Is this image real or AI-generated?"), chain-of-thought with explicit reasoning steps, and a structured forensic analysis prompt asking the model to enumerate specific artifacts before rendering a verdict.

We evaluated GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, and LLaVA-1.6 (as an open-weight baseline).

## The Results

The honest summary: performance was uneven and category-dependent in ways that matter a lot for real applications.

**Face-swap deepfakes** proved surprisingly difficult for all models. Zero-shot accuracy hovered around 60–65% across frontier models — only marginally better than chance for high-quality fakes. Chain-of-thought prompting improved this by 8–12 percentage points, with models learning to reason about lighting consistency, edge blending, and gaze direction. The structured forensic prompt did best, getting some models to 78–80% on high-quality fakes — still far below specialized detectors on this category.

**Full-face synthesis** (GAN or diffusion-generated faces) was easier. Frontier models correctly identified these at 85–92% zero-shot, dropping modestly for high-resolution samples. The models seemed to have internalized heuristics about uncanny symmetry and background-face integration that work reasonably well here.

**AI-generated text** attribution was where performance diverged most sharply. GPT-4o showed a systematic conservative bias — it was reluctant to classify text as AI-generated even when it was, likely as a consequence of safety training. Claude 3.5 was more willing to reason transparently about stylistic markers, achieving the best accuracy on this sub-task. Both were far less reliable on shorter texts.

**SR-processed deepfakes** — as in our prior work — degraded all models' performance, with 10–18 point drops across the board.

## What the Reasoning Reveals

One thing multimodal LLMs offer that specialized detectors don't is interpretable reasoning. When we analyzed the chain-of-thought outputs, a pattern emerged: the models were often *right* about what to look for but *wrong* about what they saw. A model might correctly identify "check the ear region for blending artifacts," then conclude "the ears look natural" on a face where the ears were clearly the giveaway to human experts.

This suggests the failure mode isn't primarily a knowledge problem — it's a perception problem. The models have good forensic priors encoded in language, but their visual feature extraction isn't sharp enough to act on those priors reliably.

## Implications

Multimodal LLMs are not ready to replace specialized detectors for high-stakes deepfake detection. But they're also not irrelevant: the structured forensic prompt approach approaches specialized detector performance on some categories, and the interpretable reasoning makes them useful as audit tools or second-opinion systems.

The more interesting finding, to me, is how category-dependent everything is. A system that performs excellently on GAN faces might be nearly useless on face-swaps. Any honest evaluation of a detection approach needs to specify which threat model it's actually addressing.

The benchmark data and prompts are available on request. We're planning a follow-up examining whether fine-tuning on forensic annotations substantially closes the gap for face-swap detection — that result will be more definitive.
