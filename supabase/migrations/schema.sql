-- InsightML Production Schema
-- Authentication: Clerk (no Supabase Auth)
-- Security: Application-level filtering by clerk_user_id. RLS disabled.
-- Run this in Supabase SQL Editor to reset and initialize the database.

-- ==========================================
-- EXTENSIONS
-- ==========================================
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. PROFILES TABLE
-- ==========================================
create table if not exists public.profiles (
  clerk_user_id text primary key,
  username text,
  email text,
  first_name text,
  last_name text,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ==========================================
-- 2. USER PROGRESS TABLE
-- ==========================================
create table if not exists public.user_progress (
  id uuid primary key default uuid_generate_v4(),
  clerk_user_id text unique references public.profiles(clerk_user_id) on delete cascade,
  total_xp integer default 0,
  current_level integer default 1,
  current_streak integer default 0,
  longest_streak integer default 0,
  total_learning_minutes integer default 0,
  completed_modules text[] default '{}',
  completed_challenges text[] default '{}',
  last_activity date,
  updated_at timestamp with time zone default now()
);

-- ==========================================
-- 3. DAILY ACTIVITY TABLE
-- ==========================================
create table if not exists public.daily_activity (
  id uuid primary key default uuid_generate_v4(),
  clerk_user_id text references public.profiles(clerk_user_id) on delete cascade,
  activity_date date not null,
  xp integer default 0,
  learning_minutes integer default 0,
  modules_completed integer default 0,
  challenges_completed integer default 0,
  streak_counted boolean default true,
  created_at timestamp with time zone default now(),
  unique (clerk_user_id, activity_date)
);

-- ==========================================
-- 4. LEARNING SESSIONS TABLE
-- ==========================================
create table if not exists public.learning_sessions (
  id uuid primary key default uuid_generate_v4(),
  clerk_user_id text references public.profiles(clerk_user_id) on delete cascade,
  module text not null,
  mode text not null,
  duration integer default 0,
  accuracy numeric default null,
  loss numeric default null,
  xp integer default 0,
  created_at timestamp with time zone default now()
);

-- ==========================================
-- 5. MODULE PROGRESS TABLE
-- ==========================================
create table if not exists public.module_progress (
  id uuid primary key default uuid_generate_v4(),
  clerk_user_id text references public.profiles(clerk_user_id) on delete cascade,
  module_name text not null,
  story_completed boolean default false,
  sandbox_completed boolean default false,
  challenge_completed boolean default false,
  best_accuracy numeric default null,
  best_loss numeric default null,
  updated_at timestamp with time zone default now(),
  unique (clerk_user_id, module_name)
);

-- ==========================================
-- 6. ACHIEVEMENTS TABLE
-- ==========================================
create table if not exists public.achievements (
  id uuid primary key default uuid_generate_v4(),
  clerk_user_id text references public.profiles(clerk_user_id) on delete cascade,
  achievement_key text not null,
  unlocked_at timestamp with time zone default now(),
  unique (clerk_user_id, achievement_key)
);

-- ==========================================
-- 7. BADGES TABLE
-- ==========================================
create table if not exists public.badges (
  id uuid primary key default uuid_generate_v4(),
  clerk_user_id text references public.profiles(clerk_user_id) on delete cascade,
  badge_key text not null,
  earned_at timestamp with time zone default now(),
  unique (clerk_user_id, badge_key)
);

-- ==========================================
-- PERFORMANCE INDEXES
-- ==========================================
create index if not exists idx_profiles_clerk_user_id on public.profiles(clerk_user_id);
create index if not exists idx_user_progress_clerk_user_id on public.user_progress(clerk_user_id);
create index if not exists idx_daily_activity_clerk_user_id_date on public.daily_activity(clerk_user_id, activity_date);
create index if not exists idx_learning_sessions_clerk_user_id on public.learning_sessions(clerk_user_id);
create index if not exists idx_module_progress_clerk_user_id on public.module_progress(clerk_user_id);
create index if not exists idx_achievements_clerk_user_id on public.achievements(clerk_user_id);
create index if not exists idx_badges_clerk_user_id on public.badges(clerk_user_id);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;
alter table public.daily_activity enable row level security;
alter table public.learning_sessions enable row level security;
alter table public.module_progress enable row level security;
alter table public.achievements enable row level security;
alter table public.badges enable row level security;

-- Helper to retrieve Clerk User ID from client header x-clerk-user-id
create or replace function public.current_clerk_user_id() 
returns text as $$
begin
  return nullif(current_setting('request.headers', true)::json->>'x-clerk-user-id', '');
exception
  when others then
    return null;
end;
$$ language plpgsql stable security definer;

-- Drop policies if they already exist
drop policy if exists "Manage own profile" on public.profiles;
drop policy if exists "Manage own progress" on public.user_progress;
drop policy if exists "Manage own daily activity" on public.daily_activity;
drop policy if exists "Manage own learning sessions" on public.learning_sessions;
drop policy if exists "Manage own module progress" on public.module_progress;
drop policy if exists "Manage own achievements" on public.achievements;
drop policy if exists "Manage own badges" on public.badges;

-- Create policies for Profiles
create policy "Manage own profile" on public.profiles
  for all using (public.current_clerk_user_id() = clerk_user_id)
  with check (public.current_clerk_user_id() = clerk_user_id);

-- Create policies for User Progress
create policy "Manage own progress" on public.user_progress
  for all using (public.current_clerk_user_id() = clerk_user_id)
  with check (public.current_clerk_user_id() = clerk_user_id);

-- Create policies for Daily Activity
create policy "Manage own daily activity" on public.daily_activity
  for all using (public.current_clerk_user_id() = clerk_user_id)
  with check (public.current_clerk_user_id() = clerk_user_id);

-- Create policies for Learning Sessions
create policy "Manage own learning sessions" on public.learning_sessions
  for all using (public.current_clerk_user_id() = clerk_user_id)
  with check (public.current_clerk_user_id() = clerk_user_id);

-- Create policies for Module Progress
create policy "Manage own module progress" on public.module_progress
  for all using (public.current_clerk_user_id() = clerk_user_id)
  with check (public.current_clerk_user_id() = clerk_user_id);

-- Create policies for Achievements
create policy "Manage own achievements" on public.achievements
  for all using (public.current_clerk_user_id() = clerk_user_id)
  with check (public.current_clerk_user_id() = clerk_user_id);

-- Create policies for Badges
create policy "Manage own badges" on public.badges
  for all using (public.current_clerk_user_id() = clerk_user_id)
  with check (public.current_clerk_user_id() = clerk_user_id);


-- ==========================================
-- 8. VIDEO PROGRESS TABLE
-- ==========================================
create table if not exists public.video_progress (
  id uuid primary key default uuid_generate_v4(),
  clerk_user_id text references public.profiles(clerk_user_id) on delete cascade,
  video_id text not null,
  topic text not null,
  watched boolean default false,
  watch_percentage integer default 0,
  quiz_completed boolean default false,
  quiz_score integer,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  unique (clerk_user_id, video_id)
);

-- ==========================================
-- 9. VIDEO QUIZ RESULTS TABLE
-- ==========================================
create table if not exists public.video_quiz_results (
  id uuid primary key default uuid_generate_v4(),
  clerk_user_id text references public.profiles(clerk_user_id) on delete cascade,
  video_id text not null,
  score integer not null,
  total_questions integer not null,
  answers jsonb,
  passed boolean default false,
  attempted_at timestamp with time zone default now()
);

-- ==========================================
-- 10. CERTIFICATE EXAMS TABLE
-- ==========================================
create table if not exists public.certificate_exams (
  id uuid primary key default uuid_generate_v4(),
  module text not null,
  question text not null,
  options jsonb not null,
  correct_answer text not null,
  explanation text,
  difficulty text default 'medium'
);

-- ==========================================
-- 11. CERTIFICATE RESULTS TABLE
-- ==========================================
create table if not exists public.certificate_results (
  id uuid primary key default uuid_generate_v4(),
  clerk_user_id text references public.profiles(clerk_user_id) on delete cascade,
  module text not null,
  score integer not null,
  total_questions integer not null,
  passed boolean default false,
  attempted_at timestamp with time zone default now()
);

-- ==========================================
-- 12. CERTIFICATES TABLE
-- ==========================================
create table if not exists public.certificates (
  id uuid primary key default uuid_generate_v4(),
  clerk_user_id text references public.profiles(clerk_user_id) on delete cascade,
  module text not null,
  student_name text not null,
  issued_at timestamp with time zone default now(),
  cert_id text unique not null,
  unique (clerk_user_id, module)
);

-- ==========================================
-- 13. CERTIFICATE VERIFICATION TABLE
-- ==========================================
create table if not exists public.certificate_verification (
  cert_id text primary key,
  clerk_user_id text,
  module text not null,
  student_name text not null,
  issued_at timestamp with time zone,
  is_valid boolean default true
);

-- Disable Row Level Security for new tables to prevent 42501 errors
alter table public.video_progress disable row level security;
alter table public.video_quiz_results disable row level security;
alter table public.certificate_exams disable row level security;
alter table public.certificate_results disable row level security;
alter table public.certificates disable row level security;
alter table public.certificate_verification disable row level security;


-- ==========================================
-- SEED DATA FOR CERTIFICATE EXAMS
-- ==========================================
truncate table public.certificate_exams;

-- Perceptron Questions (15 Questions)
insert into public.certificate_exams (module, question, options, correct_answer, explanation, difficulty) values
('perceptron', 'What is a Perceptron in Machine Learning?', '["A type of biological neuron found in the human eye", "A simple mathematical model of a biological neuron used for binary classification", "An advanced convolutional layer used in computer vision", "A regression algorithm for predicting continuous target values"]', 'A simple mathematical model of a biological neuron used for binary classification', 'The Perceptron is a fundamental binary classifier developed by Frank Rosenblatt that models a single artificial neuron.', 'easy'),
('perceptron', 'Which activation function was originally used in Rosenblatt''s classic Perceptron?', '["Sigmoid function", "ReLU (Rectified Linear Unit)", "Heaviside step function", "Hyperbolic tangent (tanh)"]', 'Heaviside step function', 'Rosenblatt''s classic Perceptron uses a step function (often yielding -1 or 1, or 0 or 1) to determine the binary classification output.', 'medium'),
('perceptron', 'What type of decision boundary is generated by a single-layer Perceptron?', '["A non-linear curved boundary", "A linear boundary (hyperplane)", "A circular classification boundary", "A piecewise constant step boundary"]', 'A linear boundary (hyperplane)', 'A single-layer Perceptron uses a linear combination of inputs and weights, thus creating a linear decision boundary (a line in 2D, a plane in 3D, a hyperplane in higher dimensions).', 'easy'),
('perceptron', 'Under what condition is the classic Perceptron learning algorithm guaranteed to converge to a solution?', '["If the dataset has more features than samples", "If the dataset is linearly separable", "If the learning rate is set to exactly 1.0", "If the weights are initialized to random positive values"]', 'If the dataset is linearly separable', 'According to the Perceptron Convergence Theorem, if the two classes are linearly separable, the Perceptron learning algorithm is guaranteed to find a separating hyperplane in a finite number of steps.', 'medium'),
('perceptron', 'Which logical operation cannot be solved by a single-layer Perceptron?', '["AND", "OR", "XOR", "NOT"]', 'XOR', 'XOR is not linearly separable. A single-layer Perceptron can only classify linearly separable patterns, so it cannot compute the XOR function.', 'easy'),
('perceptron', 'What is the role of the bias term in a Perceptron?', '["To prevent the weights from becoming zero", "To shift the activation function threshold away from the origin", "To scale the inputs dynamically", "To add non-linearity to the output directly"]', 'To shift the activation function threshold away from the origin', 'The bias allows the decision boundary to be shifted away from the origin, giving the Perceptron the flexibility to learn boundaries that do not pass through (0,0).', 'medium'),
('perceptron', 'In the Perceptron learning rule, what determines the amount of weight adjustment at each update step?', '["Only the input values", "The product of the learning rate, the input, and the prediction error", "The ratio of input weights to output bias", "The total number of training epochs"]', 'The product of the learning rate, the input, and the prediction error', 'The update formula is: Weight = Weight + (Learning Rate * (Target - Output) * Input). This represents the product of learning rate, error, and input.', 'medium'),
('perceptron', 'What happens if you train a single-layer Perceptron on a dataset that is NOT linearly separable?', '["It will converge to a non-linear separating boundary", "It will automatically stop when accuracy reaches 50%", "The weights will oscillate and fail to converge", "It will dynamically add another layer to resolve the conflict"]', 'The weights will oscillate and fail to converge', 'When the dataset is not linearly separable, the Perceptron algorithm will iterate indefinitely without ever finding a perfect boundary, causing the weights to oscillate.', 'hard'),
('perceptron', 'How does a learning rate that is too high affect Perceptron training?', '["It causes the weights to remain static and never update", "It can cause the updates to overshoot the optimal separating boundary", "It changes the step activation function into a sigmoid function", "It reduces the model''s ability to solve the OR logical operation"]', 'It can cause the updates to overshoot the optimal separating boundary', 'A very high learning rate can make the weight updates too aggressive, causing the decision boundary to jump back and forth (overshoot) and potentially delay or prevent convergence.', 'medium'),
('perceptron', 'What is the weighted sum in a Perceptron?', '["The sum of inputs multiplied by their respective weights", "The average of all input values", "The product of the inputs and the bias", "The sum of outputs from all epochs"]', 'The sum of inputs multiplied by their respective weights', 'The weighted sum (net input) is calculated as: z = (x1 * w1) + (x2 * w2) + ... + (xn * wn) + bias.', 'easy'),
('perceptron', 'If the target output is 1 and the Perceptron predicts 1, what is the weight update?', '["The weights are doubled", "The weights remain unchanged", "The weights are set to 0", "The weights are adjusted by the learning rate"]', 'The weights remain unchanged', 'Since the prediction is correct, the error (Target - Output) is 0, meaning no weight adjustments are made.', 'easy'),
('perceptron', 'If target is 0 and prediction is 1, and learning rate is 0.1, what is the weight update for input x = 2?', '["+0.2", "-0.2", "0.0", "-1.0"]', '-0.2', 'Error = Target - Output = 0 - 1 = -1. Update = Learning Rate * Error * Input = 0.1 * -1 * 2 = -0.2.', 'hard'),
('perceptron', 'Which of the following describes a Multi-Layer Perceptron (MLP)?', '["A collection of single-layer Perceptrons trained in parallel without connections", "A feedforward neural network with input, hidden, and output layers", "A recurrent model that cannot use activation functions", "A model that can only solve linear classification problems"]', 'A feedforward neural network with input, hidden, and output layers', 'An MLP is a class of feedforward artificial neural network containing one or more hidden layers, allowing it to solve non-linearly separable problems.', 'medium'),
('perceptron', 'Can a single Perceptron represent the logical AND function?', '["No, because AND is not linearly separable", "Yes, by choosing appropriate weights and bias", "Only if the inputs are continuous real numbers", "Only if the learning rate is zero"]', 'Yes, by choosing appropriate weights and bias', 'Yes, AND is linearly separable. For example, weights w1=1, w2=1, and bias=-1.5 represents the AND gate.', 'medium'),
('perceptron', 'What is the threshold condition for the standard binary Perceptron step function (where output is 1 if net input >= threshold, else 0)?', '["The sum of inputs is positive", "The weighted sum plus bias is greater than or equal to 0", "The learning rate is greater than 0.5", "The error rate is zero"]', 'The weighted sum plus bias is greater than or equal to 0', 'With bias included in the sum, the threshold condition is simply: weighted_sum + bias >= 0.', 'easy'),

-- Gradient Descent Questions (15 Questions)
insert into public.certificate_exams (module, question, options, correct_answer, explanation, difficulty) values
('gradient-descent', 'What is the primary goal of the Gradient Descent optimization algorithm?', '["To maximize the model weights", "To minimize the cost/loss function", "To increase the learning rate over time", "To randomly search for classification labels"]', 'To minimize the cost/loss function', 'Gradient Descent is an optimization algorithm used to minimize a cost or loss function by iteratively moving in the direction of steepest descent.', 'easy'),
('gradient-descent', 'In which direction does the gradient vector point?', '["The direction of steepest decrease of the function", "The direction of steepest increase of the function", "Orthogonal to the optimal parameter values", "Always parallel to the vertical axis"]', 'The direction of steepest increase of the function', 'The gradient vector points in the direction of the steepest ascent (steepest increase) of the function. Therefore, to minimize a function, we must move in the opposite direction (-gradient).', 'medium'),
('gradient-descent', 'What parameter determines the size of the steps taken to reach the minimum in Gradient Descent?', '["The Epoch Count", "The Loss Rate", "The Learning Rate (alpha)", "The Bias multiplier"]', 'The Learning Rate (alpha)', 'The learning rate (often denoted as alpha or eta) is a hyperparameter that controls the step size at each iteration when moving toward a minimum.', 'easy'),
('gradient-descent', 'What is a major risk of using a learning rate that is too large?', '["The model will take too long to converge", "The weights will stay at zero", "The algorithm may overshoot the minimum and diverge", "The gradient will become exactly zero immediately"]', 'The algorithm may overshoot the minimum and diverge', 'If the learning rate is too large, the step size will be too big, causing the parameter updates to bounce back and forth, potentially overshooting the minimum and causing the loss to increase (diverge).', 'medium'),
('gradient-descent', 'What is a major disadvantage of a learning rate that is too small?', '["The algorithm might oscillate indefinitely", "The learning process will be extremely slow and may get stuck in local minima", "The cost function will increase with every step", "The weights will automatically reset to random values"]', 'The learning process will be extremely slow and may get stuck in local minima', 'A learning rate that is too small results in tiny steps, which means the model will require a very long time to converge and is more likely to get stuck in shallow local minima.', 'medium'),
('gradient-descent', 'What is Batch Gradient Descent?', '["An algorithm that updates weights after processing every single sample", "An algorithm that updates weights after calculating the loss on the entire dataset", "An algorithm that uses random subsets of weights for updates", "An algorithm that only trains the bias parameter"]', 'An algorithm that updates weights after calculating the loss on the entire dataset', 'Batch Gradient Descent computes the gradient of the cost function with respect to the parameters for the entire training dataset before performing a single update.', 'medium'),
('gradient-descent', 'What is Stochastic Gradient Descent (SGD)?', '["An algorithm that updates parameters after processing each individual training example", "An optimization algorithm that uses a variable batch size of exactly 50%", "An algorithm that randomly changes the learning rate after every epoch", "A classification model built entirely on step functions"]', 'An algorithm that updates parameters after processing each individual training example', 'Stochastic Gradient Descent (SGD) updates parameters for each training example one by one, making it much faster and allowing online learning, though updates are noisier.', 'medium'),
('gradient-descent', 'What is Mini-batch Gradient Descent?', '["A method that only trains 10% of the network layers", "A compromise that updates parameters based on small, random splits of the dataset", "A technique that avoids using gradients entirely", "An optimization process that only operates on the bias term"]', 'A compromise that updates parameters based on small, random splits of the dataset', 'Mini-batch Gradient Descent splits the training dataset into small batches (e.g., 32, 64, or 128 samples) and performs parameter updates for each batch, balancing speed and update stability.', 'easy'),
('gradient-descent', 'What is a local minimum in a cost function?', '["The absolute lowest point of the cost function across all possible parameter values", "A point where the cost is lower than neighboring points, but not necessarily the absolute lowest", "A point where the learning rate becomes zero", "The initial starting point of the parameters"]', 'A point where the cost is lower than neighboring points, but not necessarily the absolute lowest', 'A local minimum is a parameter configuration where the cost is lower than surrounding configurations, but a global minimum (which is the lowest overall) may exist elsewhere.', 'medium'),
('gradient-descent', 'For a convex cost function, which of the following is true?', '["There are many local minima and no global minimum", "Any local minimum is also the global minimum", "The gradient is constant at all points", "The learning rate must be set to zero for convergence"]', 'Any local minimum is also the global minimum', 'Convex functions have a bowl-like shape with only one basin. Therefore, any local minimum is also the global minimum, making optimization straightforward.', 'hard'),
('gradient-descent', 'What is the gradient of a function at a local or global minimum?', '["Exactly zero", "Infinity", "The learning rate value", "Positive one"]', 'Exactly zero', 'At any minimum (local or global), the slope of the tangent line is flat, meaning the gradient (derivative) is exactly zero.', 'easy'),
('gradient-descent', 'How does Gradient Descent change the weights if the derivative of the cost with respect to a weight is positive?', '["It increases the weight", "It decreases the weight", "It keeps the weight unchanged", "It sets the weight to zero"]', 'It decreases the weight', 'The update rule is: Weight = Weight - (Learning Rate * Gradient). If the gradient (derivative) is positive, we subtract a positive value, thereby decreasing the weight.', 'hard'),
('gradient-descent', 'What is the role of the loss function in Gradient Descent?', '["To define the size of the steps during optimization", "To measure how well the model parameters fit the training data", "To compute the activation values of the hidden layers", "To automatically initialize weights and bias"]', 'To measure how well the model parameters fit the training data', 'The loss function quantifies the error between the model''s predictions and the actual targets, providing the metric that Gradient Descent seeks to minimize.', 'easy'),
('gradient-descent', 'What is "exploding gradients" in Gradient Descent?', '["When the gradient values become extremely small, approaching zero", "When the gradients grow exponentially, causing huge weight updates and instability", "When the loss function reaches exactly zero", "When the learning rate is automatically multiplied by 10"]', 'When the gradients grow exponentially, causing huge weight updates and instability', 'Exploding gradients occur when large gradients accumulate during training, causing massive updates to the weights, leading to mathematical overflow or training instability.', 'medium'),
('gradient-descent', 'Which of the following is a common technique to address getting stuck in local minima or saddle points in SGD?', '["Setting the learning rate to zero", "Using momentum", "Reverting to Batch Gradient Descent", "Removing the bias term"]', 'Using momentum', 'Momentum is an optimization technique that adds a fraction of the past update vector to the current update, helping the algorithm roll over local minima and pass through flat saddle points.', 'hard'),

-- Neural Network Questions (15 Questions)
insert into public.certificate_exams (module, question, options, correct_answer, explanation, difficulty) values
('neural-net', 'What is the purpose of hidden layers in a Neural Network?', '["To store the raw input data for visualization", "To extract hierarchical, abstract features and learn non-linear representations", "To ensure the network output is always a binary value", "To dynamically adjust the network''s learning rate"]', 'To extract hierarchical, abstract features and learn non-linear representations', 'Hidden layers allow artificial neural networks to learn complex, non-linear relationships by combining features from preceding layers into more abstract representations.', 'medium'),
('neural-net', 'Why are non-linear activation functions (like Sigmoid or ReLU) crucial in neural networks?', '["To make the model train faster by using simple linear algebra", "Without them, the network would collapse into a single linear model, regardless of depth", "To force the weights to remain positive at all times", "To calculate the initial learning rate of the optimization algorithm"]', 'Without them, the network would collapse into a many-layer linear model, regardless of depth', 'If all activation functions are linear, a composition of linear functions is still just a linear function. Non-linear activation functions enable the network to learn non-linear decision boundaries.', 'hard'),
('neural-net', 'What is backpropagation in the context of neural networks?', '["The process of feeding input data forward to calculate predictions", "An algorithm that computes the gradient of the loss function with respect to weights using the chain rule", "A method for pruning unused neurons from hidden layers", "A technique to store network configurations in a database"]', 'An algorithm that computes the gradient of the loss function with respect to weights using the chain rule', 'Backpropagation (backward propagation of errors) uses the chain rule of calculus to calculate the gradient of the loss function with respect to each weight, moving backward from the output layer.', 'medium'),
('neural-net', 'Which activation function is defined as f(x) = max(0, x)?', '["Sigmoid", "Tanh (Hyperbolic Tangent)", "ReLU (Rectified Linear Unit)", "Softmax"]', 'ReLU (Rectified Linear Unit)', 'ReLU outputs the input directly if it is positive, and zero otherwise. Mathematically: f(x) = max(0, x).', 'easy'),
('neural-net', 'What is the "vanishing gradient problem"?', '["When the loss function becomes exactly zero during training", "When gradients become extremely small in early layers, stopping the weights from updating", "When the learning rate is set to a negative value", "When all neurons in a layer output a constant value of 1.0"]', 'When gradients become extremely small in early layers, stopping the weights from updating', 'As gradients are backpropagated through many layers, repeated multiplication of small numbers (like sigmoid derivatives) can cause the gradient to shrink to near zero, preventing early layers from learning.', 'hard'),
('neural-net', 'What is the primary function of the Softmax activation function in the output layer?', '["To map inputs to a range between -1 and 1", "To output a probability distribution over multiple mutually exclusive classes", "To accelerate backpropagation in recurrent neural networks", "To clip weights above a predefined threshold value"]', 'To output a probability distribution over multiple mutually exclusive classes', 'Softmax normalizes the output values of the network into a probability distribution that sums to 1.0, making it ideal for multi-class classification problems.', 'medium'),
('neural-net', 'Which layer of a neural network receives the raw features of the dataset?', '["The Hidden Layer", "The Output Layer", "The Input Layer", "The Activation Layer"]', 'The Input Layer', 'The input layer is the entry point of the network that receives the raw features of the training or test dataset.', 'easy'),
('neural-net', 'In a fully connected (dense) layer, what is the connection pattern of the neurons?', '["Neurons are only connected to their immediate neighbors in the same layer", "Each neuron is connected to every neuron in the previous layer", "Neurons are randomly connected to a subset of all layers", "There are no connections between neurons"]', 'Each neuron is connected to every neuron in the previous layer', 'In a fully connected (dense) layer, each neuron receives input connections from all neurons of the preceding layer.', 'easy'),
('neural-net', 'What mathematical rule is heavily utilized in backpropagation to compute derivatives of composed functions?', '["The Product Rule", "The Quotient Rule", "The Chain Rule", "L''Hopital''s Rule"]', 'The Chain Rule', 'The Chain Rule of calculus is used to calculate the derivative of a composite function, which is essential to backpropagate error gradients from the output layer through hidden layers.', 'medium'),
('neural-net', 'What is an epoch in neural network training?', '["One complete forward and backward pass of the entire training dataset", "The step size taken by the gradient descent algorithm", "The time it takes to compute a single weight update", "The number of hidden layers in the network structure"]', 'One complete forward and backward pass of the entire training dataset', 'An epoch represents one full cycle of training where the network has seen and processed the entire training dataset once.', 'medium'),
('neural-net', 'What is "overfitting" in neural networks?', '["When the network performs exceptionally well on both training and test data", "When the network memorizes training data but fails to generalize to unseen test data", "When the weights become too small to represent any features", "When the network structure has too few hidden layers"]', 'When the network memorizes training data but fails to generalize to unseen test data', 'Overfitting occurs when a network learns the noise and details of the training data too well, leading to high training accuracy but poor performance on new, unseen validation or test data.', 'easy'),
('neural-net', 'Which of the following is a common regularization technique used to prevent overfitting by randomly disabling neurons during training?', '["Batch Normalization", "Dropout", "Gradient Clipping", "Weight Initialization"]', 'Dropout', 'Dropout is a regularization technique where randomly selected neurons are ignored (dropped out) during training steps, which forces the network to learn redundant and robust representations.', 'medium'),
('neural-net', 'What is the role of weights in a neural network?', '["To determine the steepness of the step function", "To scale the strength of the connection and input signal between neurons", "To serve as a constant offset value for the output layer", "To control the number of training epochs"]', 'To scale the strength of the connection and input signal between neurons', 'Weights represent the strength or coefficient of the connection between neurons, amplifying or dampening the input signal as it propagates forward.', 'easy'),
('neural-net', 'What is a bias in a neural network neuron?', '["A systematic error in the training dataset", "An additional parameter that shifts the activation function curve relative to the origin", "The ratio of training samples to validation samples", "The learning rate multiplier used in backpropagation"]', 'An additional parameter that shifts the activation function curve relative to the origin', 'Similar to the y-intercept in linear equations, a bias is a learnable parameter that shifts the activation function to the left or right, allowing better fitting.', 'easy'),
('neural-net', 'What does the loss function (e.g., Mean Squared Error or Cross-Entropy) measure?', '["The percentage of neurons that are active in a hidden layer", "The distance between the predicted output of the network and the ground truth labels", "The total number of parameters in the neural network", "The speed at which the weights converge to their optimal values"]', 'The distance between the predicted output of the network and the ground truth labels', 'The loss function measures the discrepancy or error between predicted values and actual ground truth labels, guiding the weights updates to minimize error.', 'easy');



