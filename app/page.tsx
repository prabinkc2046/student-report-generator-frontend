'use client';

import { useState, useEffect } from 'react';

// Types
interface AttributeCategory {
  name: string;
  icon: string;
  id: string;
  items: { value: string; label: string; emoji: string }[];
}

// Attribute categories data
const attributeCategories: AttributeCategory[] = [
  {
    name: 'Reading Skills',
    icon: '📖',
    id: 'reading',
    items: [
      { value: 'reads fluently at grade level', label: 'Reads fluently at grade level', emoji: '📘' },
      { value: 'reads above grade level with comprehension', label: 'Reads above grade level with comprehension', emoji: '⭐' },
      { value: 'struggles with decoding words', label: 'Struggles with decoding words', emoji: '⚠️' },
      { value: 'needs support with phonics', label: 'Needs support with phonics', emoji: '🆘' },
      { value: 'has difficulty with reading comprehension', label: 'Has difficulty with reading comprehension', emoji: '🤔' },
      { value: 'reads with good expression and pacing', label: 'Reads with good expression and pacing', emoji: '🎭' },
      { value: 'reads slowly and hesitantly', label: 'Reads slowly and hesitantly', emoji: '🐢' },
      { value: 'enjoys reading independently', label: 'Enjoys reading independently', emoji: '📚' },
      { value: 'needs encouragement to read at home', label: 'Needs encouragement to read at home', emoji: '🏠' },
    ],
  },
  {
    name: 'Writing Skills',
    icon: '✍️',
    id: 'writing',
    items: [
      { value: 'writes creative and imaginative stories', label: 'Writes creative and imaginative stories', emoji: '🎨' },
      { value: 'struggles with organizing ideas in writing', label: 'Struggles with organizing ideas in writing', emoji: '📝' },
      { value: 'has neat and legible handwriting', label: 'Has neat and legible handwriting', emoji: '✍️' },
      { value: 'needs improvement in handwriting legibility', label: 'Needs improvement in handwriting legibility', emoji: '🔤' },
      { value: 'uses rich vocabulary in writing', label: 'Uses rich vocabulary in writing', emoji: '📖' },
      { value: 'struggles with spelling and punctuation', label: 'Struggles with spelling and punctuation', emoji: '🔡' },
      { value: 'writes complete sentences with proper grammar', label: 'Writes complete sentences with proper grammar', emoji: '✅' },
      { value: 'needs support with sentence structure', label: 'Needs support with sentence structure', emoji: '🏗️' },
    ],
  },
  {
    name: 'Mathematics Skills',
    icon: '🔢',
    id: 'math',
    items: [
      { value: 'excels in mental math calculations', label: 'Excels in mental math calculations', emoji: '🧮' },
      { value: 'struggles with basic addition and subtraction', label: 'Struggles with basic addition and subtraction', emoji: '➕' },
      { value: 'understands multiplication and division concepts', label: 'Understands multiplication and division concepts', emoji: '✖️' },
      { value: 'needs support with multiplication tables', label: 'Needs support with multiplication tables', emoji: '📊' },
      { value: 'has difficulty with word problems', label: 'Has difficulty with word problems', emoji: '📝' },
      { value: 'good at problem-solving and logical reasoning', label: 'Good at problem-solving and logical reasoning', emoji: '💡' },
      { value: 'struggles with fractions and decimals', label: 'Struggles with fractions and decimals', emoji: '🔢' },
      { value: 'understands geometry and measurement concepts', label: 'Understands geometry and measurement concepts', emoji: '📐' },
      { value: 'applies math skills to real-life situations', label: 'Applies math skills to real-life situations', emoji: '🌍' },
    ],
  },
  {
    name: 'Behavior & Social Skills',
    icon: '🤝',
    id: 'behavior',
    items: [
      { value: 'works cooperatively in group settings', label: 'Works cooperatively in group settings', emoji: '👥' },
      { value: 'respectful towards teachers and staff', label: 'Respectful towards teachers and staff', emoji: '🙏' },
      { value: 'kind and helpful to classmates', label: 'Kind and helpful to classmates', emoji: '💝' },
      { value: 'shares materials and takes turns', label: 'Shares materials and takes turns', emoji: '🎲' },
      { value: 'shy and hesitant to participate in groups', label: 'Shy and hesitant to participate in groups', emoji: '😊' },
      { value: 'follows classroom rules consistently', label: 'Follows classroom rules consistently', emoji: '✅' },
      { value: 'easily distracted by surroundings or peers', label: 'Easily distracted', emoji: '🔄' },
      { value: 'fidgets frequently during seat work', label: 'Fidgets during seat work', emoji: '🪑' },
    ],
  },
  {
    name: 'Emotional & Work Habits',
    icon: '💖',
    id: 'emotional',
    items: [
      { value: 'manages emotions appropriately', label: 'Manages emotions appropriately', emoji: '😌' },
      { value: 'becomes anxious during tests or assessments', label: 'Anxious during tests', emoji: '😰' },
      { value: 'easily frustrated when facing challenges', label: 'Easily frustrated', emoji: '😤' },
      { value: 'stresses when there is too much priority', label: 'Stresses with priorities', emoji: '📚' },
      { value: 'persists through difficult tasks', label: 'Persists through difficult tasks', emoji: '💪' },
      { value: 'completes homework on time consistently', label: 'Completes homework on time', emoji: '⏰' },
      { value: 'organized and keeps materials tidy', label: 'Organized', emoji: '📁' },
      { value: 'works well independently', label: 'Works well independently', emoji: '🪑' },
    ],
  },
];

export default function Home() {
  const [studentName, setStudentName] = useState('');
  const [gender, setGender] = useState('female');
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [customAttributes, setCustomAttributes] = useState('');
  const [report, setReport] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editInstructions, setEditInstructions] = useState('');
  const [currentEditingIndex, setCurrentEditingIndex] = useState<number>(-1);
  const [currentSentences, setCurrentSentences] = useState<string[]>([]);
  const [currentReportText, setCurrentReportText] = useState('');

  // Update selected attributes when checkboxes change
  const updateSelectedAttributes = () => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const selected: string[] = [];
    checkboxes.forEach((checkbox: any) => {
      if (checkbox.checked) {
        selected.push(checkbox.value);
      }
    });
    
    if (customAttributes.trim()) {
      const customItems = customAttributes.split(',').map(item => item.trim()).filter(item => item);
      selected.push(...customItems);
    }
    
    setSelectedAttributes(selected);
  };

  // Remove attribute
  const removeAttribute = (attribute: string) => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox: any) => {
      if (checkbox.value === attribute && checkbox.checked) {
        checkbox.checked = false;
      }
    });
    
    const customItems = customAttributes.split(',').map(item => item.trim());
    const filteredItems = customItems.filter(item => item !== attribute);
    setCustomAttributes(filteredItems.join(', '));
    
    updateSelectedAttributes();
  };

  // Select all in category
  const selectAllInCategory = (categoryId: string) => {
    const checkboxes = document.querySelectorAll(`#${categoryId} input[type="checkbox"]`);
    const allChecked = Array.from(checkboxes).every((cb: any) => cb.checked);
    checkboxes.forEach((checkbox: any) => {
      checkbox.checked = !allChecked;
    });
    updateSelectedAttributes();
  };

  // Generate report using native fetch
  const generateReport = async () => {
    if (!studentName.trim()) {
      alert('Please enter the student name.');
      return;
    }
    
    if (selectedAttributes.length === 0) {
      alert('Please select at least one student characteristic.');
      return;
    }
    
    setLoading(true);
    setReport('');
    
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_name: studentName,
          gender: gender,
          attributes: selectedAttributes.join(', ')
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setReport(data.report);
        setCharCount(data.char_count);
        setCurrentReportText(data.report);
        
        // Split into sentences for editing
        const sentences = data.report.match(/[^.!?]+[.!?]+/g) || [data.report];
        setCurrentSentences(sentences.map((s: string) => s.trim()));
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please make sure the Flask backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal for sentence
  const openSentenceEditModal = (index: number) => {
    setCurrentEditingIndex(index);
    setEditInstructions('');
    setEditModalOpen(true);
  };

  // Open edit modal for full report
  const openFullEditModal = () => {
    setCurrentEditingIndex(-1);
    setEditInstructions('');
    setEditModalOpen(true);
  };

  // Save edited report using native fetch
  const saveEditedReport = async () => {
    if (!editInstructions.trim()) {
      alert('Please enter your editing instructions.');
      return;
    }
    
    setEditModalOpen(false);
    setLoading(true);
    
    try {
      let response;
      if (currentEditingIndex === -1) {
        // Full report edit
        response = await fetch('/api/edit-full-report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            original_report: currentReportText,
            teacher_instructions: editInstructions
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          setCurrentReportText(data.revised_report);
          setReport(data.revised_report);
          setCharCount(data.new_total_length);
          
          const sentences = data.revised_report.match(/[^.!?]+[.!?]+/g) || [data.revised_report];
          setCurrentSentences(sentences.map((s: string) => s.trim()));
        } else {
          alert('Error: ' + data.error);
        }
      } else {
        // Single sentence edit
        response = await fetch('/api/edit-sentence', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            original_sentence: currentSentences[currentEditingIndex],
            teacher_suggestion: editInstructions
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          const updatedSentences = [...currentSentences];
          updatedSentences[currentEditingIndex] = data.revised_sentence;
          setCurrentSentences(updatedSentences);
          const newReport = updatedSentences.join(' ');
          setCurrentReportText(newReport);
          setReport(newReport);
          setCharCount(data.new_sentence_length);
        } else {
          alert('Error: ' + data.error);
        }
      }
    } catch (error) {
      console.error('Error editing report:', error);
      alert('Failed to edit report.');
    } finally {
      setLoading(false);
    }
  };

  // Clear form
  const clearForm = () => {
    setStudentName('');
    setGender('female');
    setCustomAttributes('');
    setReport('');
    setCharCount(0);
    setCurrentReportText('');
    setCurrentSentences([]);
    
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox: any) => {
      checkbox.checked = false;
    });
    
    updateSelectedAttributes();
  };

  // Display report with edit buttons
  const displayReportWithEditButtons = () => {
    if (!currentReportText) {
      return <em className="text-gray-500">Select student characteristics and click "Generate Professional Report" to create a teacher report.</em>;
    }
    
    return currentSentences.map((sentence, index) => (
      <div key={index} className="mb-4 p-3 bg-white rounded-lg border-l-4 border-purple-500 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <span className="text-gray-700 leading-relaxed flex-1">{sentence}</span>
          <button
            onClick={() => openSentenceEditModal(index)}
            className="ml-3 px-3 py-1 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700 transition-colors"
          >
            ✏️ Edit
          </button>
        </div>
      </div>
    ));
  };

  // Add event listeners for checkboxes on mount
  useEffect(() => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox: any) => {
      checkbox.addEventListener('change', updateSelectedAttributes);
    });
    
    return () => {
      checkboxes.forEach((checkbox: any) => {
        checkbox.removeEventListener('change', updateSelectedAttributes);
      });
    };
  }, []);

  // Update selected attributes when custom attributes change
  useEffect(() => {
    updateSelectedAttributes();
  }, [customAttributes]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 p-5">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">📝 Student Report Generator</h1>
          <p className="text-lg opacity-90">Professional Primary School Teacher Reports - Exactly 850 Characters</p>
        </div>
        
        {/* Warning Banner */}
        <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg mb-5 text-center border-l-4 border-yellow-500">
          ⚠️ Reports use ONLY the characteristics you select. No additional qualities or ideas will be added.
        </div>
        
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          {/* Input Section */}
          <div className="p-8 bg-gray-50 border-b border-gray-200">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              <div>
                <label className="block font-semibold mb-2 text-gray-700">👤 Student Name</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter student's full name"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2 text-gray-700">⚥ Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </div>
            </div>
            
            {/* Attributes Section */}
            <div className="mt-5">
              <label className="block font-semibold mb-3 text-gray-700">📋 Select Student Characteristics (Granular Options)</label>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {attributeCategories.map((category) => (
                  <div key={category.id} className="bg-white rounded-xl p-5 border-2 border-gray-200 hover:border-purple-500 transition-all max-h-[500px] overflow-y-auto">
                    <div className="sticky top-0 bg-white pb-3 mb-3 border-b-2 border-purple-500">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-purple-600 flex items-center gap-2">
                          <span>{category.icon}</span> {category.name}
                        </h3>
                        <button
                          onClick={() => selectAllInCategory(`${category.id}-group`)}
                          className="px-3 py-1 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700 transition-colors"
                        >
                          Select All
                        </button>
                      </div>
                    </div>
                    <div id={`${category.id}-group`} className="space-y-2">
                      {category.items.map((item, idx) => (
                        <label key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-all">
                          <input
                            type="checkbox"
                            value={item.value}
                            onChange={updateSelectedAttributes}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <span className="text-sm text-gray-700 cursor-pointer flex-1">
                            <span className="mr-2">{item.emoji}</span> {item.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Custom Attributes */}
            <div className="mt-6 p-5 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <h4 className="mb-2 text-gray-800 font-semibold flex items-center gap-2">
                <span>✏️</span> Custom Characteristics (Optional)
                <span className="text-xs font-normal text-gray-500">Add any characteristics not listed above</span>
              </h4>
              <textarea
                value={customAttributes}
                onChange={(e) => setCustomAttributes(e.target.value)}
                placeholder="Enter additional characteristics, separated by commas (e.g., loves singing, good at sports, plays musical instrument, talented in art)"
                className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors resize-y min-h-[80px]"
              />
            </div>
            
            {/* Selected Attributes Display */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-purple-500">
              <h4 className="mb-2 text-gray-800 font-semibold">📌 Selected Characteristics (Report will use ONLY these):</h4>
              <div className="flex flex-wrap gap-2">
                {selectedAttributes.length === 0 ? (
                  <span className="text-gray-500">None selected</span>
                ) : (
                  selectedAttributes.map((attr, idx) => (
                    <span key={idx} className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {attr}
                      <button
                        onClick={() => removeAttribute(attr)}
                        className="hover:text-red-300 font-bold"
                      >
                        ✖
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={generateReport}
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Generating...' : '✨ Generate Professional Report'}
              </button>
              <button
                onClick={clearForm}
                className="flex-1 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
              >
                🗑️ Clear All
              </button>
            </div>
          </div>
          
          {/* Output Section */}
          <div className="p-8 bg-white">
            <div className="flex justify-between items-center mb-5 pb-3 border-b-2 border-gray-100">
              <h2 className="text-2xl font-semibold text-gray-800">📄 Generated Report</h2>
              <div className="flex gap-3 items-center">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  charCount === 850 ? 'bg-green-500 text-white' : 'bg-yellow-500 text-gray-800'
                }`}>
                  Characters: {charCount}/850
                </span>
                {currentReportText && (
                  <button
                    onClick={openFullEditModal}
                    className="px-3 py-1 bg-yellow-500 text-gray-800 text-sm rounded-md hover:bg-yellow-600 transition-colors"
                  >
                    ✏️ Edit Full Report
                  </button>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl border-l-4 border-purple-500 min-h-[200px]">
              {loading ? (
                <div className="text-center py-10">
                  <div className="inline-block w-12 h-12 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-600">Generating professional report...</p>
                </div>
              ) : (
                displayReportWithEditButtons()
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-[90%] max-w-2xl max-h-[80vh] overflow-y-auto animate-slideIn">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-5 rounded-t-2xl flex justify-between items-center">
              <h3 className="text-xl font-semibold">✏️ Edit Report</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-2xl font-bold hover:text-red-300 transition-colors">
                &times;
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 p-4 rounded-lg mb-5 border-l-4 border-purple-500">
                <strong className="block mb-2 text-purple-600">Current Text:</strong>
                <div className="text-gray-700">
                  {currentEditingIndex === -1 ? currentReportText : currentSentences[currentEditingIndex]}
                </div>
              </div>
              <label className="block font-semibold mb-2 text-gray-700">Your Editing Instructions:</label>
              <textarea
                value={editInstructions}
                onChange={(e) => setEditInstructions(e.target.value)}
                rows={6}
                placeholder="Example:
- Make the tone more encouraging
- Add more specific examples about math skills
- Soften the language about behavior issues
- Focus more on reading progress"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors resize-y"
              />
              <div className="flex gap-4 mt-5">
                <button
                  onClick={saveEditedReport}
                  className="flex-1 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  💾 Save Changes
                </button>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(-50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}