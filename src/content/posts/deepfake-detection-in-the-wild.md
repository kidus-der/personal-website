---
title: "Deepfake Detection in the Wild: Why Super-Resolution Breaks Your Detector"
description: Super-resolution post-processing can fool state-of-the-art deepfake detectors — here's what we found and why it matters.
publishedAt: "2026-02-15"
tags: ["Research", "AI", "Computer Vision", "Deepfakes"]
draft: false
---

Deepfake detection has become one of the more urgent problems in applied computer vision. The standard benchmark numbers look reassuring — many detectors report 95%+ accuracy on held-out test sets. But those benchmarks share a quiet assumption: the fake you're trying to detect looks roughly the way the model expects a fake to look.

Our research asked a simpler question: what happens when you apply super-resolution (SR) to a deepfake before detection?

## The Attack Surface

Modern deepfake generation pipelines often produce outputs at moderate resolution — 256×256 or 512×512 — which are then upscaled for distribution. Super-resolution networks like ESRGAN or Real-ESRGAN are trained to reconstruct realistic high-frequency texture from low-resolution inputs. They're very good at their job.

The problem is that these networks don't just sharpen images — they *regenerate* texture. And a lot of the forensic signal that deepfake detectors rely on lives in exactly that high-frequency texture: compression artifacts, blending inconsistencies, subtle color space errors left by the face-swap network.

When SR passes over a deepfake, it doesn't know it's looking at a fake. It faithfully regenerates what it believes the real texture should be — and in doing so, it scrubs the forensic fingerprints.

## What We Found

We evaluated several prominent detectors (FaceXRay, LipForensics, CLIP-based classifiers) against SR-processed deepfakes from the FaceForensics++ and DFDC datasets. Across the board, detection accuracy dropped significantly — in some cases by more than 30 percentage points — when SR was applied as a preprocessing step prior to submission to the detector.

The degradation wasn't uniform. Detectors that relied heavily on low-level frequency artifacts were most affected. Detectors with stronger semantic understanding of facial dynamics held up somewhat better, but still degraded.

This isn't a new category of adversarial attack in the classical sense — no gradient descent, no white-box access to the model. It's a single off-the-shelf tool, applied once, before the image ever reaches the detector.

## Why This Matters

The practical implication is uncomfortable: a determined actor uploading deepfakes through a platform with an AI detector can trivially pre-process through SR and expect a meaningful reduction in detection rate. The computational cost is low, the tooling is public, and the result looks better to human viewers as well.

The research implication is that detection benchmarks that don't account for SR preprocessing are measuring something narrower than robustness. A 95% accuracy on raw deepfakes is a different claim than 95% accuracy on deepfakes seen in the wild, where post-processing is the norm rather than the exception.

## Paths Forward

A few directions look promising. Training detectors on SR-augmented fakes during fine-tuning improves robustness substantially — the model learns to find features that survive SR. Ensemble approaches that combine frequency-domain analysis with semantic feature extraction are more resilient than either alone. And detection at the distribution level (looking at collections of images rather than individual frames) may be less susceptible to per-image SR manipulation.

None of these fully close the gap, but they narrow it. The larger point is that the threat model for deepfake detection needs to include post-processing as a first-class consideration — not an edge case.

The full paper is available on request. If you're working on media forensics or have thoughts on SR-robust detection approaches, I'd be glad to hear from you.
