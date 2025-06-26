import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../layout/Navbar';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Brain, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  ArrowRight,
  Loader,
  Target,
  Award,
  BookOpen
} from 'lucide-react';

const Quiz = () => {
  const { materialId } = useParams();

  const [quizzes, setQuizzes] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds

  useEffect(() => {
    fetchQuizzes();
  }, [materialId]);

  useEffect(() => {
    if (timeLeft > 0 && !showResults) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !showResults) {
      handleSubmitQuiz();
    }
  }, [timeLeft, showResults]);

  const fetchQuizzes = async () => {
    try {
      const response = await axios.get(`/quizzes/by-material/${materialId}`);
      setQuizzes(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      toast.error('Failed to load quiz questions');
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizzes.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(answers[currentQuestionIndex + 1] || null);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswer(answers[currentQuestionIndex - 1] || null);
    }
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(answers).length < quizzes.length) {
      const confirmed = window.confirm(
        `You have ${quizzes.length - Object.keys(answers).length} unanswered questions. Are you sure you want to submit?`
      );
      if (!confirmed) return;
    }

    setSubmitting(true);
    try {
      // Submit each answer
      const results = [];
      for (let i = 0; i < quizzes.length; i++) {
        const answer = answers[i];
        if (answer) {
          const response = await axios.post(`/quizzes/${quizzes[i].quizId}/answer`, {
            selectedOption: answer
          });
          results.push({
            questionIndex: i,
            question: quizzes[i].question,
            selectedAnswer: answer,
            correctAnswer: response.data.correct,
            isCorrect: response.data.isCorrect,
            feedback: response.data.feedback
          });
        }
      }

      const correctAnswers = results.filter(r => r.isCorrect).length;
      const score = Math.round((correctAnswers / quizzes.length) * 100);

      setResults({
        totalQuestions: quizzes.length,
        answeredQuestions: Object.keys(answers).length,
        correctAnswers,
        score,
        details: results
      });
      setShowResults(true);
      toast.success('Quiz submitted successfully!');
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Brain className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No quiz available</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no quiz questions available for this material.
            </p>
            <div className="mt-6">
              <Link
                to="/courses"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courses
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quizzes[currentQuestionIndex];
  const options = ['A', 'B', 'C', 'D'];
  const optionLabels = {
    'A': currentQuestion?.optionA,
    'B': currentQuestion?.optionB,
    'C': currentQuestion?.optionC,
    'D': currentQuestion?.optionD
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            to="/courses"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Courses
          </Link>
          
          <div className="flex justify-between items-center">
            
            
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              timeLeft < 300 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
            }`}>
              <Clock className="h-5 w-5" />
              <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        {!showResults ? (
          <>
            <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Question {currentQuestionIndex + 1} of {quizzes.length}
                </span>
                <span className="text-sm text-gray-500">
                  {Object.keys(answers).length} answered
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / quizzes.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {currentQuestion?.question}
                </h2>
                
                <div className="space-y-3">
                  {options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswerSelect(option)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                        selectedAnswer === option
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                          selectedAnswer === option
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-300'
                        }`}>
                          {selectedAnswer === option && <CheckCircle className="h-4 w-4" />}
                        </div>
                        <span className="font-medium text-gray-900 mr-2">{option}.</span>
                        <span className="text-gray-700">{optionLabels[option]}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center mt-4">
              <div className="flex w-full justify-between">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </button>
                <div className="flex space-x-2">
                  {currentQuestionIndex < quizzes.length - 1 ? (
                    <button
                      onClick={handleNextQuestion}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={submitting}
                      className="inline-flex items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <Loader className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Target className="h-4 w-4 mr-2" />
                          Submit Quiz
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">AI can make mistakes.</p>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center mb-8">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                results.score >= 80 ? 'bg-green-100' : 
                results.score >= 60 ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <Award className={`h-8 w-8 ${
                  results.score >= 80 ? 'text-green-600' : 
                  results.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
              <p className="text-gray-600 mb-4">Here's how you performed:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900">Score</p>
                  <p className={`text-2xl font-bold ${
                    results.score >= 80 ? 'text-green-600' : 
                    results.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {results.score}%
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-900">Correct</p>
                  <p className="text-2xl font-bold text-green-600">
                    {results.correctAnswers}/{results.totalQuestions}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-purple-900">Answered</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {results.answeredQuestions}/{results.totalQuestions}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Question Details</h3>
              {results.details.map((result, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                    {result.isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <p className="text-gray-700 mb-2">{result.question}</p>
                  <div className="text-sm text-gray-600">
                    <p>Your answer: <span className="font-medium">{result.selectedAnswer}</span></p>
                    <p>Correct answer: <span className="font-medium text-green-600">{result.correctAnswer}</span></p>
                    <p className="mt-1 text-blue-600">{result.feedback}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center space-x-4">
              <Link
                to="/courses"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Back to Courses
              </Link>
              <button
                onClick={() => {
                  setShowResults(false);
                  setCurrentQuestionIndex(0);
                  setAnswers({});
                  setSelectedAnswer(null);
                  setTimeLeft(900);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Target className="h-4 w-4 mr-2" />
                Retake Quiz
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz; 