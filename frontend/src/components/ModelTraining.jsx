import React, { useState } from 'react';

const ModelTraining = ({ language = 'en' }) => {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingResult, setTrainingResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const translations = {
    en: {
      title: 'AI Model Training',
      subtitle: 'Train ML model on accumulated health data',
      trainButton: 'Train Model',
      training: 'Training...',
      success: 'Training Successful! ✅',
      error: 'Training Failed ❌',
      accuracy: 'Accuracy',
      samplesUsed: 'Samples Used',
      noData: 'Insufficient data for training',
      insufficientMsg: 'Need at least 2+ health records per user',
      retryButton: 'Try Again',
      useML: 'Now using ML model for predictions',
      useRules: 'Still using rule-based assessment',
    },
    ne: {
      title: 'AI मोडल प्रशिक्षण',
      subtitle: 'जमा भएको स्वास्थ्य डेटामा ML मोडल प्रशिक्षण गर्नुहोस्',
      trainButton: 'मोडल प्रशिक्षण गर्नुहोस्',
      training: 'प्रशिक्षण चलिरहेको छ...',
      success: 'प्रशिक्षण सफल! ✅',
      error: 'प्रशिक्षण असफल ❌',
      accuracy: 'सटीकता',
      samplesUsed: 'नमूनाहरू प्रयोग गरिएको',
      noData: 'प्रशिक्षणको लागि अपर्याप्त डेटा',
      insufficientMsg: 'प्रति उपयोगकर्ता कम्तिमा २+ स्वास्थ्य रेकर्डको आवश्यकता छ',
      retryButton: 'पुनः प्रयास गर्नुहोस्',
      useML: 'अघि बढी ML मोडल भविष्यवाणीको लागि प्रयोग गरिँदैछ',
      useRules: 'अझै पनी नियम-आधारित मूल्यांकन प्रयोग गरिँदैछ',
    }
  };

  const t = translations[language] || translations.en;

  const handleTrain = async () => {
    setIsTraining(true);
    setError(null);
    setTrainingResult(null);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 15, 90));
      }, 300);

      // Call training endpoint
      const response = await fetch('http://localhost:8001/api/train-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error('Training request failed');
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        setTrainingResult({
          success: true,
          accuracy: data.accuracy,
          samples: data.samples_used,
          message: data.message,
        });
      } else {
        setTrainingResult({
          success: false,
          message: data.message || t.noData,
        });
      }
    } catch (err) {
      setError(err.message);
      setTrainingResult({
        success: false,
        message: t.error,
      });
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className={`p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200 shadow-lg ${
      language === 'ne' ? 'font-nepali' : ''
    }`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-purple-700 mb-2">{t.title}</h2>
        <p className="text-gray-600">{t.subtitle}</p>
      </div>

      {/* Info Box */}
      <div className="bg-white rounded-lg p-4 mb-6 border-l-4 border-blue-500">
        <p className="text-sm text-gray-700">
          💡 Train an AI model on your health data to improve risk predictions. The model learns patterns from your health history.
        </p>
      </div>

      {/* Training Button */}
      <div className="mb-6">
        <button
          onClick={handleTrain}
          disabled={isTraining}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300 ${
            isTraining
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg hover:scale-105 active:scale-95'
          }`}
        >
          {isTraining ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t.training}
            </div>
          ) : (
            t.trainButton
          )}
        </button>
      </div>

      {/* Progress Bar */}
      {isTraining && (
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">{progress}%</p>
        </div>
      )}

      {/* Results */}
      {trainingResult && (
        <div className={`p-4 rounded-lg border-l-4 mb-4 ${
          trainingResult.success
            ? 'bg-green-50 border-green-500'
            : 'bg-red-50 border-red-500'
        }`}>
          <h3 className={`font-semibold mb-2 ${
            trainingResult.success ? 'text-green-700' : 'text-red-700'
          }`}>
            {trainingResult.success ? t.success : t.error}
          </h3>
          
          {trainingResult.success ? (
            <>
              <p className="text-gray-700 mb-3">{trainingResult.message}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded">
                  <p className="text-sm text-gray-600">{t.accuracy}</p>
                  <p className="text-2xl font-bold text-green-600">
                    {trainingResult.accuracy.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-white p-3 rounded">
                  <p className="text-sm text-gray-600">{t.samplesUsed}</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {trainingResult.samples}
                  </p>
                </div>
              </div>
              <div className="mt-3 p-2 bg-green-100 rounded text-sm text-green-800">
                ✅ {t.useML}
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-700 mb-3">{trainingResult.message}</p>
              <p className="text-sm text-gray-600 mb-3">{t.insufficientMsg}</p>
              <div className="p-2 bg-yellow-100 rounded text-sm text-yellow-800">
                ⚠️ {t.useRules}
              </div>
            </>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg border-l-4 bg-red-50 border-red-500 mb-4">
          <p className="text-red-700 font-semibold">Error: {error}</p>
        </div>
      )}

      {/* Next Steps Info */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">📊 How it works:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Collects health data from all users</li>
          <li>• Trains RandomForest (100 decision trees)</li>
          <li>• Learns risk patterns automatically</li>
          <li>• Improves future predictions</li>
        </ul>
      </div>
    </div>
  );
};

export default ModelTraining;
