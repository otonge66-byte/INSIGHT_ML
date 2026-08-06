export interface GlossaryTerm {
  term: string;
  definition: string;
  analogy?: string;
}

export const GLOSSARY_TERMS: Record<string, GlossaryTerm> = {
  "loss surface": {
    term: "Loss Surface",
    definition: "A mathematical landscape where elevation represents model error. Algorithms try to navigate downhill to the lowest valley.",
    analogy: "Like a topographical map where your goal is finding the deepest crater.",
  },
  "gradient": {
    term: "Gradient (∇L)",
    definition: "A vector pointing in the direction of steepest loss increase. Moving in the negative gradient direction decreases error fastest.",
    analogy: "Feeling which way the ground slopes steepest under your feet.",
  },
  "gradient descent": {
    term: "Gradient Descent",
    definition: "An optimization algorithm that takes iterative steps downhill along the negative gradient to minimize loss.",
    analogy: "Like feeling your way down a foggy hill by stepping in the steepest downhill direction.",
  },
  "convergence": {
    term: "Convergence",
    definition: "The state where training loss stops decreasing and settles at a minimum error point.",
    analogy: "Reaching the flat floor of a valley where taking extra steps no longer lowers your height.",
  },
  "overfitting": {
    term: "Overfitting",
    definition: "When a complex model memorizes training noise rather than general patterns, failing on new unseen data.",
    analogy: "Memorizing exact practice test questions instead of learning the actual subject.",
  },
  "hidden layer": {
    term: "Hidden Layer",
    definition: "Intermediate neuron layers between inputs and outputs that transform feature representations non-linearly.",
    analogy: "A team of translators breaking a complex question down into sub-concepts.",
  },
  "hidden layers": {
    term: "Hidden Layers",
    definition: "Intermediate neuron layers between inputs and outputs that transform feature representations non-linearly.",
    analogy: "A team of translators breaking a complex question down into sub-concepts.",
  },
  "perceptron": {
    term: "Perceptron",
    definition: "The foundational artificial neuron that computes a weighted sum of inputs and applies a threshold function.",
    analogy: "A single decision filter evaluating weighted pro/con factors.",
  },
  "decision boundary": {
    term: "Decision Boundary",
    definition: "The hyper-plane or surface separating space into different classification output regions.",
    analogy: "A boundary line dividing two territories on a map.",
  },
  "learning rate": {
    term: "Learning Rate (η)",
    definition: "A hyperparameter controlling the size of step taken during each weight update.",
    analogy: "Choosing between tiny careful steps or huge jumping leaps down a mountain.",
  },
  "backpropagation": {
    term: "Backpropagation",
    definition: "The chain-rule algorithm that calculates gradients backwards through neural network layers.",
    analogy: "Tracing a final recipe flaw back through each chef's contribution.",
  },
  "xor": {
    term: "XOR (Exclusive OR)",
    definition: "A fundamental non-linearly separable binary operation requiring at least one hidden layer to solve.",
    analogy: "A light switch system where either switch A or B works, but turning on both turns the light off.",
  },
  "xor pattern": {
    term: "XOR Pattern",
    definition: "A classic non-linearly separable classification task that single-layer perceptrons cannot solve.",
    analogy: "Four points arranged diagonally like a checkerboard.",
  },
};
