import React from 'react';

const DepartmentSelectorTesting = ({ 
  selectedDepartment, 
  onDepartmentChange, 
  lang,
  className 
}) => {
  // Define departments with their labels in both languages - this component is a temporary solution for testing and context design since there are no AI buttons on any live web pages that can pass a url parameter yet 
  
  const departments = [
    { code: '', label: { en: 'None/Home', fr: 'Aucun/Accueil' } },
    { code: 'CRA', label: { en: 'CRA', fr: 'ARC' } },
    { code: 'ESDC', label: { en: 'ESDC', fr: 'EDSC' } },
    { code: 'IRCC', label: { en: 'IRCC', fr: 'IRCC' } },
    { code: 'ISC', label: { en: 'ISC', fr: 'SAC' } },
    { code: 'PSPC', label: { en: 'PSPC', fr: 'SPAC' } }
  ];

  return (
    <div className={`department-selector ${className || ''}`}>
      {departments.map((dept) => (
        <button
          key={dept.code}
          onClick={() => onDepartmentChange(dept.code)}
          className="button-as-link"
          style={{
            marginRight: '1rem',
            textDecoration: selectedDepartment === dept.code ? 'underline' : 'none'
          }}
        >
          {dept.label[lang]}
        </button>
      ))}
    </div>
  );
};

export default DepartmentSelectorTesting;