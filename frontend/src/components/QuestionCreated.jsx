import React from 'react'
import right from '../assets/right.png'
import { Share2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom';

function QuestionCreated() {
    const navigate = useNavigate();
    return (
        <>
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-[#F7F7F7] rounded-2xl shadow-sm border border-gray-200 p-12 max-w-3xl text-center">
                    <div className="flex justify-center mb-6">
                            <img src={right} className="w-16 h-16 text-white" />
                    </div>

                    <h1 className="text-xl font-medium text-gray-900 mb-8">
                        Congrats! Your test is published and ready to be shared!
                    </h1>

                    <div className="space-y-3 flex flex-col justify-center items-center">
                        <button className="w-[300px] bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-full transition-colors flex items-center justify-center gap-2">
                            <Share2 className="w-4 h-4" />
                            Share Test
                        </button>

                        <button className="w-[300px] bg-gray-700 hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-full transition-colors">
                            Take Test (Preview)
                        </button>

                        <button
                            onClick={() => navigate('/Examination')}
                            className="w-[200px] bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-full border border-gray-300 transition-colors"
                        >
                            View Test
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default QuestionCreated
