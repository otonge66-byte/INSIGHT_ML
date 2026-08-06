"use client";

import React, { useState } from "react";
import { ByteSprite } from "@/components/sprites/ByteSprite";

export const NeuralDigitProject: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const STEPS = [
    {
      title: "1. The Goal: Reading Human Handwriting",
      content: (
        <div className="space-y-4">
          <p className="text-lg leading-relaxed text-[#c8ecd0]">
            Google Photos can instantly search handwritten text in scanned receipts. Post offices automatically sort millions of letters every day by reading zip codes written by thousands of different people. Mobile banking apps let you deposit checks by snapping a picture of hand-written dollar amounts.
          </p>
          <div className="bg-[#1e140e] border-2 border-[#382219] p-4 font-vt323 text-lg space-y-2">
            <div className="text-[#dda15e] font-pixel text-[10px] mb-2">👁️ REAL-WORLD TASK</div>
            <p className="text-sm text-[#a3b18a]">
              At the heart of all of these applications is a computer vision model trained on handwritten digits. Everyone writes numbers differently—some tilt their 7s, loop their 8s, or cross their 4s. A simple linear classifier fails on this task, but a 2-layer Neural Network can extract spatial strokes and recognize any digit with high precision.
            </p>
          </div>
          <p className="text-base text-[#a3b18a]">
            Let&apos;s break down how this 256-input neural network sees pixel grids and classifies handwritten numbers!
          </p>
        </div>
      ),
    },
    {
      title: "2. The 256-Neuron Input Layer",
      content: (
        <div className="space-y-4">
          <p className="text-lg leading-relaxed text-[#c8ecd0]">
            To process a hand-drawn digit, we divide a 16×16 drawing canvas into 256 individual grid cells. Each cell corresponds to an input neuron representing the grayscale density of that pixel (where <code className="text-[#dda15e] bg-[#1e140e] px-1.5">0.0</code> is black/background and <code className="text-[#dda15e] bg-[#1e140e] px-1.5">1.0</code> is white/ink).
          </p>
          <div className="bg-[#1e140e] border-2 border-[#382219] p-4 font-vt323 text-lg space-y-2">
            <div className="text-[#dda15e] font-pixel text-[10px] mb-2">📥 PIXEL VECTOR REPRESENTATION</div>
            <p className="text-sm text-[#a3b18a]">
              The network receives a flat vector array: <code className="text-[#dda15e]">[x₀, x₁, x₂, ..., x₂₅₅]</code> of size 256. This represents raw sensory data fed directly to the first layer of connections.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "3. Hidden Feature Detectors",
      content: (
        <div className="space-y-4">
          <p className="text-lg leading-relaxed text-[#c8ecd0]">
            The 16 neurons in the hidden layer act as sub-feature detectors. During training, weights adjust so that specific hidden neurons activate strongly in response to specific stroke geometries (e.g. horizontal lines, loops, or diagonal arcs).
          </p>
          <div className="bg-[#1e140e] border-2 border-[#382219] p-4 font-vt323 text-lg space-y-2">
            <div className="text-[#dda15e] font-pixel text-[10px] mb-2">🧠 FEATURE ACTIVATION BLUEPRINT</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-[#dda15e] font-bold">Neuron 0:</span> Loop Detector (useful for 0, 8, 9)</div>
              <div><span className="text-[#dda15e] font-bold">Neuron 1:</span> Left Vertical Bar (useful for 4, 5, 6)</div>
              <div><span className="text-[#dda15e] font-bold">Neuron 2:</span> Right Vertical Bar (useful for 1, 2, 3, 7)</div>
              <div><span className="text-[#dda15e] font-bold">Neuron 3:</span> Top Horizontal Bar (useful for 5, 7, 8)</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "4. Propagation Equation",
      content: (
        <div className="space-y-4">
          <p className="text-lg leading-relaxed text-[#c8ecd0]">
            Activations propagate forward. For each layer, we multiply inputs by weight matrices, add bias vectors, and pass the results through non-linear activation functions (like Sigmoid or ReLU):
          </p>
          <div className="bg-[#1e140e] border-2 border-[#382219] p-4 font-vt323 text-lg space-y-2">
            <div className="text-[#dda15e] font-pixel text-[10px] mb-2">⛓️ FORWARD PROPAGATION CHAIN</div>
            <div className="text-center py-2 bg-[#120c08] border border-[#2e1d14] rounded">
              <code className="text-xl text-[#fefae0] font-bold">a_hidden = σ(W₁ · a_input + b₁)</code>
            </div>
            <div className="text-center py-2 bg-[#120c08] border border-[#2e1d14] rounded mt-1">
              <code className="text-xl text-[#fefae0] font-bold">a_output = σ(W₂ · a_hidden + b₂)</code>
            </div>
            <p className="text-[#a3b18a] text-sm mt-2">
              Where <code className="text-[#dda15e]">σ</code> is the sigmoid function, <code className="text-[#dda15e]">W₁</code> and <code className="text-[#dda15e]">W₂</code> are the connection weights, and <code className="text-[#dda15e]">b₁</code> and <code className="text-[#dda15e]">b₂</code> are biases.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "5. Outputs & Confidence",
      content: (
        <div className="space-y-4">
          <p className="text-lg leading-relaxed text-[#c8ecd0]">
            The final layer contains 10 output neurons representing classes <code className="text-[#dda15e]">0</code> to <code className="text-[#dda15e]">9</code>. The neuron with the highest activation percentage represents the model&apos;s classification prediction.
          </p>
          <div className="bg-[#1e140e] border-2 border-[#382219] p-4 font-vt323 text-lg space-y-2">
            <div className="text-[#dda15e] font-pixel text-[10px] mb-2">🎯 CONFIDENCE MATRIX OUTPUT</div>
            <p className="text-[#a3b18a] text-sm">
              Applying the Softmax activation function converts raw output values into a relative probability distribution that sums up to 100%, indicating how confident the network is in its prediction.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "6. PyTorch Implementation",
      content: (
        <div className="space-y-4">
          <p className="text-lg leading-relaxed text-[#c8ecd0]">
            This standard PyTorch class implements the 3Blue1Brown MNIST neural network structure:
          </p>
          <div className="bg-[#1e140e] border-2 border-[#382219] p-3 font-mono text-xs overflow-x-auto text-[#a3b18a]">
            <pre>{`import torch
import torch.nn as nn
import torch.nn.functional as F

class MNISTClassifier(nn.Module):
    def __init__(self):
        super(MNISTClassifier, self).__init__()
        # Input: 256 grayscale pixels
        # Hidden Layer: 16 neurons
        # Output Layer: 10 digit classes
        self.fc1 = nn.Linear(256, 16)
        self.fc2 = nn.Linear(16, 10)

    def forward(self, x):
        # Flatten input: batch_size x 256
        x = x.view(-1, 256)
        # Activation in hidden layer
        x = torch.sigmoid(self.fc1(x))
        # Final output logits
        x = self.fc2(x)
        return F.log_softmax(x, dim=1)
`}</pre>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 text-[#fefae0]">
      {/* BYTE Hero Narration Box */}
      <div className="bg-[#18110b] border-4 border-[#386641] p-5 shadow-[6px_6px_0px_#0f0a07] relative flex flex-col md:flex-row gap-5 items-start">
        <div className="flex-shrink-0 bg-[#0d150e] border-2 border-[#2a5c30] p-3 flex flex-col items-center gap-1 shadow-[2px_2px_0px_#050d07]">
          <ByteSprite scale={3} />
          <span className="font-pixel text-[8px] text-[#7ecb8a]">BYTE GUIDE</span>
        </div>

        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[9px] bg-[#bc4749] text-[#fefae0] px-2 py-0.5 border border-[#6b2123] uppercase">
              MODULE 03 • APPLIED CAPSTONE
            </span>
            <span className="font-pixel text-[8px] text-[#bc4749]">
              NEURAL NET DIGIT RECOGNIZER
            </span>
          </div>

          <h2 className="font-pixel text-xl text-[#bc4749] uppercase tracking-wide">
            Building a Handwritten Digit Recognizer with Neural Networks
          </h2>

          <p className="text-lg leading-relaxed text-[#c8ecd0] font-vt323">
            Outstanding work conquering hidden layers and non-linear decision boundaries in the Forest playground! You&apos;ve seen how ReLU activations and hidden nodes allow networks to learn complex curves. Now, let&apos;s step up to the capstone project: deploying the exact same multi-layer architecture to solve a famous real-world vision task. This is the iconic MNIST model that launched the modern deep learning revolution!
          </p>
        </div>
      </div>

      {/* Blueprint Tabs & Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tab list */}
        <div className="lg:col-span-4 space-y-2">
          {STEPS.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`w-full text-left font-pixel text-[11px] uppercase p-4 border-4 transition-all ${
                activeStep === idx
                  ? "bg-[#bc4749] text-[#fefae0] border-[#6b2123] shadow-[4px_4px_0px_#0f0a07]"
                  : "bg-[#281b12] text-[#a3b18a] border-[#382219] hover:bg-[#342318]"
              }`}
            >
              {step.title}
            </button>
          ))}
        </div>

        {/* Right Column: Step details */}
        <div className="lg:col-span-8 bg-[#281b12] border-4 border-[#382219] p-6 shadow-[6px_6px_0px_#0f0a07] min-h-[300px]">
          <h3 className="font-pixel text-sm text-[#dda15e] border-b-2 border-[#382219] pb-3 mb-4 uppercase">
            {STEPS[activeStep].title}
          </h3>
          <div className="font-vt323 text-lg leading-relaxed text-[#a3b18a]">
            {STEPS[activeStep].content}
          </div>
        </div>
      </div>
    </div>
  );
};
