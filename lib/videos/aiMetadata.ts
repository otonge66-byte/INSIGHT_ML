export interface VideoAIMetadata {
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedWatchTime: string;
  whatYouWillLearn: string[];
  summary: string;
  concepts: string[];
  beforeWatching: string[];
  afterWatching: string[];
  quiz: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[];
}

const TOPIC_METADATA: Record<string, VideoAIMetadata> = {
  perceptron: {
    difficulty: "Beginner",
    estimatedWatchTime: "12 mins",
    whatYouWillLearn: [
      "Understand how perceptrons classify data",
      "Learn how weighted sums are calculated",
      "See how decision boundaries partition space",
      "Train a binary classifier from scratch"
    ],
    summary: "This video introduces the Perceptron, the earliest mathematical model of a biological neuron. You will explore how inputs are weighted, summed, and passed through a step activation function to produce a binary classification decision. The lesson covers the geometrical interpretation of weights and bias as a separating line or hyperplane, demonstrating how the algorithm updates weights iteratively upon misclassification until finding a separating decision boundary.",
    concepts: ["Perceptron", "Weights", "Bias", "Activation Function", "Binary Classification", "Decision Boundary", "Step Function"],
    beforeWatching: ["Basic Algebra", "Coordinate Geometry", "Vectors"],
    afterWatching: ["Rosenblatt's training algorithm", "Linear separability limitations", "XOR gate limitation"],
    quiz: [
      {
        question: "What is a Perceptron's primary classification output model?",
        options: [
          "Binary classification (e.g. -1/1 or 0/1)",
          "Continuous prediction (regression)",
          "Probability distributions over many labels",
          "Unsupervised clustering"
        ],
        correctAnswer: "Binary classification (e.g. -1/1 or 0/1)",
        explanation: "Perceptrons calculate a weighted sum plus bias and pass it through a step function, which yields a binary decision."
      },
      {
        question: "Which of the following functions is typically used in the classic Perceptron?",
        options: ["Heaviside Step Function", "Sigmoid Function", "ReLU Function", "Softmax Function"],
        correctAnswer: "Heaviside Step Function",
        explanation: "The original Perceptron uses a Step function (threshold activation) to map values to binary decisions."
      },
      {
        question: "What is the primary limitation of a single-layer Perceptron?",
        options: [
          "It can only learn linearly separable datasets",
          "It cannot process decimal inputs",
          "It is too slow to train on modern hardware",
          "It cannot calculate negative weights"
        ],
        correctAnswer: "It can only learn linearly separable datasets",
        explanation: "A single-layer Perceptron creates a linear boundary, so it fails on non-linearly separable data like the XOR gate."
      },
      {
        question: "What is the function of the bias term in a Perceptron?",
        options: [
          "To shift the decision boundary away from the origin",
          "To scale the inputs dynamically",
          "To add non-linearity to the weights",
          "To randomly initialize output predictions"
        ],
        correctAnswer: "To shift the decision boundary away from the origin",
        explanation: "The bias allows the line/plane boundary to shift left, right, up, or down instead of being locked to the origin (0,0)."
      },
      {
        question: "What is the weight update rule for a Perceptron on a correct classification?",
        options: [
          "No changes are made to the weights",
          "Weights are doubled",
          "Weights are set to zero",
          "Weights are decreased by the learning rate"
        ],
        correctAnswer: "No changes are made to the weights",
        explanation: "If the prediction matches the target, the error is 0, meaning the update amount is 0."
      }
    ]
  },
  "gradient-descent": {
    difficulty: "Intermediate",
    estimatedWatchTime: "15 mins",
    whatYouWillLearn: [
      "Understand loss functions and cost surfaces",
      "Learn the concept of derivatives and gradients",
      "Explore the step-size controls via learning rate",
      "Observe convergence towards a local/global minimum"
    ],
    summary: "This educational guide unpacks Gradient Descent, the workhorse optimization engine of machine learning. You will see how parameters are updated iteratively in the direction of steepest descent. By exploring how the learning rate governs step sizes, you will understand the common failure modes of overshooting (divergence) and slow training. The summary explores convex vs. non-convex surfaces, explaining local minima, saddle points, and stochastic updates.",
    concepts: ["Optimization", "Gradient Descent", "Learning Rate", "Loss Function", "Partial Derivatives", "Convexity", "Local Minima"],
    beforeWatching: ["Multivariable Calculus", "Functions", "Slopes/Slopes of Tangents"],
    afterWatching: ["Stochastic vs. Batch Gradient Descent", "Saddle points", "Momentum methods"],
    quiz: [
      {
        question: "What does the gradient vector point towards?",
        options: [
          "The direction of steepest ascent of the function",
          "The direction of steepest descent of the function",
          "The horizontal axis of the cost surface",
          "The origin point of the weights"
        ],
        correctAnswer: "The direction of steepest ascent of the function",
        explanation: "Gradients point in the direction of steepest increase. Therefore, we subtract the gradient to move in the direction of steepest decrease."
      },
      {
        question: "What hyperparameter controls the size of the steps in Gradient Descent?",
        options: ["Learning Rate", "Epoch Limit", "Batch size", "Activation slope"],
        correctAnswer: "Learning Rate",
        explanation: "The learning rate scales the gradient to adjust how large or small the parameter updates are at each step."
      },
      {
        question: "What is a major risk of setting the learning rate too high?",
        options: [
          "The cost may overshoot the minimum and diverge",
          "The algorithm will take too long to run",
          "The weights will be set to zero",
          "The gradients will vanish"
        ],
        correctAnswer: "The cost may overshoot the minimum and diverge",
        explanation: "A high learning rate creates oversized updates, causing parameters to overshoot the optimal point and bounce out of control."
      },
      {
        question: "What is Stochastic Gradient Descent (SGD)?",
        options: [
          "Updating parameters after every single training example",
          "Using a randomized learning rate dynamically",
          "Disabling backpropagation entirely",
          "Calculating the gradient of only one hidden layer"
        ],
        correctAnswer: "Updating parameters after every single training example",
        explanation: "SGD processes examples one by one, providing noisy but fast updates that help roll out of local minima."
      },
      {
        question: "What is the gradient value at a local or global minimum?",
        options: ["Exactly zero", "Negative one", "Positive infinity", "The value of the learning rate"],
        correctAnswer: "Exactly zero",
        explanation: "At any flat point (minimum or maximum), the derivative is zero, meaning no more weight adjustments will occur."
      }
    ]
  },
  "neural-net": {
    difficulty: "Advanced",
    estimatedWatchTime: "20 mins",
    whatYouWillLearn: [
      "Learn the feedforward network structure",
      "Understand the chain rule of backpropagation",
      "Discover non-linear activation functions (ReLU, Sigmoid)",
      "Analyze multi-class output normalization using Softmax"
    ],
    summary: "This visual guide details deep neural networks (Multi-Layer Perceptrons). It starts with forward propagation, calculating inputs and hidden activations, and proceeds to backpropagation. You will learn how the chain rule propagates error gradients backward from the output layer to hidden nodes. The summary covers the vanishing gradient problem, ReLU vs. Sigmoid, multi-class Softmax probability mapping, and regularization using Dropout.",
    concepts: ["Neural Networks", "Backpropagation", "Forward Propagation", "Chain Rule", "ReLU", "Sigmoid", "Softmax", "Hidden Layers", "Regularization"],
    beforeWatching: ["Matrix Multiplication", "Derivatives", "Basic Probabilities"],
    afterWatching: ["Vanishing gradients", "Regularization (Dropout)", "Network architectures"],
    quiz: [
      {
        question: "Why do we need non-linear activation functions (like ReLU or Sigmoid) in deep neural networks?",
        options: [
          "Without them, the entire network behaves as a single linear model",
          "They prevent the weights from becoming negative",
          "They reduce the cost function to zero automatically",
          "They accelerate forward propagation by avoiding matrix math"
        ],
        correctAnswer: "Without them, the entire network behaves as a single linear model",
        explanation: "A combination of linear functions is linear. Non-linear activations allow networks to approximate arbitrary non-linear boundaries."
      },
      {
        question: "Which mathematical rule is the foundation of the backpropagation algorithm?",
        options: ["The Chain Rule", "L'Hopital's Rule", "The Quotient Rule", "The Fourier Transform"],
        correctAnswer: "The Chain Rule",
        explanation: "Backpropagation calculates partial derivatives of nested functions using the Chain Rule to pass gradients backward."
      },
      {
        question: "What is the 'vanishing gradient problem'?",
        options: [
          "Gradients shrink close to zero in early layers, stopping them from learning",
          "The cost function jumps to infinity unexpectedly",
          "The model deletes its own weights during training",
          "The network has too many training epochs"
        ],
        correctAnswer: "Gradients shrink close to zero in early layers, stopping them from learning",
        explanation: "Repeated multiplication of small derivatives (e.g. Sigmoid) causes gradients in early layers to vanish, preventing training."
      },
      {
        question: "Which activation function is represented by the formula max(0, x)?",
        options: ["ReLU", "Sigmoid", "Tanh", "Softmax"],
        correctAnswer: "ReLU",
        explanation: "ReLU (Rectified Linear Unit) returns x if x > 0, and 0 otherwise, which translates to max(0, x)."
      },
      {
        question: "What is the purpose of the Softmax function in multi-class classification?",
        options: [
          "It maps values to a probability distribution summing to 1.0",
          "It sets all negative inputs to zero",
          "It dynamically increases the learning rate of the model",
          "It prevents gradients from exploding in hidden layers"
        ],
        correctAnswer: "It maps values to a probability distribution summing to 1.0",
        explanation: "Softmax normalizes the final outputs into probabilities so that classes can be evaluated mutually exclusively."
      }
    ]
  }
};

export function getAIMetadataForTopic(topic: string): VideoAIMetadata {
  const normalized = topic.toLowerCase().trim();
  // Normalize variations
  if (normalized.includes("perceptron")) return TOPIC_METADATA.perceptron;
  if (normalized.includes("descent") || normalized.includes("gradient")) return TOPIC_METADATA["gradient-descent"];
  return TOPIC_METADATA["neural-net"];
}
