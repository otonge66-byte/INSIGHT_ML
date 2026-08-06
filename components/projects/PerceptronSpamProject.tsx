"use client";

import React, { useState } from "react";
import { ByteSprite } from "@/components/sprites/ByteSprite";

export const PerceptronSpamProject: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const STEPS = [
    {
      title: "1. The Goal: Cleaning Your Inbox",
      content: (
        <div className="space-y-4">
          <p className="text-lg leading-relaxed text-[#c8ecd0]">
            Every single day, trillions of emails flood across global computer networks. Spam filters in services like Gmail, Outlook, or Apple Mail must instantaneously evaluate incoming messages and decide: <strong className="text-[#dda15e]">INBOX SAFE</strong> or <strong className="text-[#bc4749]">SPAM FOLDER</strong>.
          </p>
          <div className="bg-[#1e140e] border-2 border-[#382219] p-4 font-vt323 text-lg space-y-2">
            <div className="text-[#dda15e] font-pixel text-[10px] mb-2">📥 REAL-WORLD TASK</div>
            <p className="text-sm text-[#a3b18a]">
              Before deep neural networks existed, early email gateways used a single Perceptron neuron to solve this problem! By extracting key signals from an email—such as suspicious domain names, urgent keywords, or excessive links—and passing them as binary inputs into a single perceptron, the system computes a total threat score in microseconds.
            </p>
          </div>
          <p className="text-base text-[#a3b18a]">
            Let&apos;s break down how this real-world spam classifier works, from feature vectors to decision boundaries!
          </p>
        </div>
      ),
    },
    {
      title: "2. The Binary Feature Vector",
      content: (
        <div className="space-y-4">
          <p className="text-lg leading-relaxed text-[#c8ecd0]">
            In text classification, we convert unstructured emails into structured numbers. We define a list of spam-correlated indicators. If an indicator is present in the email, the input neuron activates to <code className="text-[#dda15e] bg-[#1e140e] px-1.5 py-0.5 border border-[#382219]">1</code>; otherwise, it stays <code className="text-[#a3b18a] bg-[#1e140e] px-1.5 py-0.5 border border-[#382219]">0</code>.
          </p>
          <div className="bg-[#1e140e] border-2 border-[#382219] p-4 font-vt323 text-lg space-y-2">
            <div className="text-[#dda15e] font-pixel text-[10px] mb-2">💡 FEATURE MATRIX DEFINITION</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm md:text-base">
              <div><span className="text-[#dda15e] font-bold">x₁:</span> Subject contains &quot;URGENT&quot; or &quot;FREE&quot;</div>
              <div><span className="text-[#dda15e] font-bold">x₂:</span> Sender email domain is unknown / unverified</div>
              <div><span className="text-[#dda15e] font-bold">x₃:</span> Body contains more than 3 external links</div>
              <div><span className="text-[#dda15e] font-bold">x₄:</span> Sent at unusual hours (1:00 AM - 4:00 AM)</div>
              <div><span className="text-[#dda15e] font-bold">x₅:</span> Includes suspicious file attachment (.exe, .zip)</div>
            </div>
          </div>
          <p className="text-base text-[#a3b18a]">
            An incoming email is represented as an array of 5 binary elements: e.g., <code className="text-[#dda15e] bg-[#1e140e] px-1.5">[1, 1, 0, 0, 1]</code>.
          </p>
        </div>
      ),
    },
    {
      title: "3. Weighted Summation & Bias",
      content: (
        <div className="space-y-4">
          <p className="text-lg leading-relaxed text-[#c8ecd0]">
            Each feature is assigned a weight based on its relative spam hazard. Urgency keywords might be weighted <code className="text-[#dda15e] bg-[#1e140e] px-1.5">1.8</code>, while executable attachments get <code className="text-[#dda15e] bg-[#1e140e] px-1.5">2.5</code>.
          </p>
          <div className="bg-[#1e140e] border-2 border-[#382219] p-4 font-vt323 text-lg space-y-2">
            <div className="text-[#dda15e] font-pixel text-[10px] mb-2">⚖️ PERCEPTRON DECISION FORMULA</div>
            <div className="text-center py-2 bg-[#120c08] border border-[#2e1d14] rounded">
              <code className="text-xl text-[#fefae0] font-bold">z = w₁·x₁ + w₂·x₂ + w₃·x₃ + w₄·x₄ + w₅·x₅ + bias</code>
            </div>
            <p className="text-[#a3b18a] text-sm mt-2">
              The <code className="text-[#dda15e]">bias</code> (e.g., <code className="text-[#dda15e]">-2.5</code>) acts as our threshold offset. If the sum of active feature weights exceeds the absolute value of the bias, the email is flagged as SPAM.
            </p>
          </div>
          <p className="text-base text-[#a3b18a]">
            Example: If an email is <code className="text-[#dda15e]">[1, 1, 0, 0, 0]</code>, the sum is <code className="text-[#dda15e]">1.8 + 1.4 - 2.5 = 0.7</code>. Since <code className="text-[#dda15e]">0.7 &gt;= 0</code>, it classifies as SPAM.
          </p>
        </div>
      ),
    },
    {
      title: "4. Standalone Python Implementation",
      content: (
        <div className="space-y-4">
          <p className="text-lg leading-relaxed text-[#c8ecd0]">
            Here is how you can write a lightweight Perceptron classifier in pure Python without external dependencies.
          </p>
          <div className="bg-[#1e140e] border-2 border-[#382219] p-3 font-mono text-xs overflow-x-auto text-[#a3b18a]">
            <pre>{`class PerceptronSpamFilter:
    def __init__(self, num_features=5):
        # Initialize weights and bias to small random numbers or zeros
        self.weights = [1.8, 1.4, 1.2, 0.9, 2.5]
        self.bias = -2.5

    def predict(self, x):
        # Calculate dot product: sum(w_i * x_i) + bias
        z = sum(w * xi for w, xi in zip(self.weights, x)) + self.bias
        # Step function activation
        return 1 if z >= 0 else 0

# Sample run: urgent subject (1) & unknown sender (1)
email_vector = [1, 1, 0, 0, 0]
filter = PerceptronSpamFilter()
is_spam = filter.predict(email_vector)
print("Classification:", "SPAM" if is_spam == 1 else "INBOX SAFE")
# Output: CLASSIFICATION: SPAM`}</pre>
          </div>
        </div>
      ),
    },
    {
      title: "5. Training Loop Feedback",
      content: (
        <div className="space-y-4">
          <p className="text-lg leading-relaxed text-[#c8ecd0]">
            When the filter misclassifies an email, we adjust the weights and bias. If it missed a spam email, we increase weights for active features. If it flagged a safe email, we decrease those weights.
          </p>
          <div className="bg-[#1e140e] border-2 border-[#382219] p-4 font-vt323 text-lg space-y-2">
            <div className="text-[#dda15e] font-pixel text-[10px] mb-2">🔄 WEIGHT UPDATE RULE</div>
            <div className="text-center py-2 bg-[#120c08] border border-[#2e1d14] rounded">
              <code className="text-xl text-[#fefae0] font-bold">w_i ← w_i + η · (target - prediction) · x_i</code>
            </div>
            <p className="text-[#a3b18a] text-sm mt-2">
              Where <code className="text-[#dda15e]">η</code> (eta) is the learning rate. This feedback loop runs iteratively over training records until classification matches historical data.
            </p>
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
            <span className="font-pixel text-[9px] bg-[#386641] text-[#fefae0] px-2 py-0.5 border border-[#1b3521] uppercase">
              MODULE 01 • APPLIED PROJECT
            </span>
            <span className="font-pixel text-[8px] text-[#8fc99a]">
              PERCEPTRON EMAIL CLASSIFIER
            </span>
          </div>

          <h2 className="font-pixel text-xl text-[#7ecb8a] uppercase tracking-wide">
            Building an Email Spam &amp; Priority Filter with Perceptrons
          </h2>

          <p className="text-lg leading-relaxed text-[#c8ecd0] font-vt323">
            Fantastic job mastering decision boundaries and linear weights in the Meadow sandbox! You&apos;ve learned how a single artificial neuron uses weights and a bias threshold to slice data points cleanly into two categories. Now, let&apos;s see how that exact same mathematical concept is deployed at real scale in production software. This is the foundational algorithm that powered early email security and launched automated text classification across the web!
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
                  ? "bg-[#386641] text-[#fefae0] border-[#7ecb8a] shadow-[4px_4px_0px_#0f0a07]"
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
