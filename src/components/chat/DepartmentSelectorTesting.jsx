import React from 'react';
import { GcdsButton } from '@cdssnc/gcds-components-react';

const DepartmentSelectorTesting = ({ 
  selectedDepartment, 
  onDepartmentChange, 
  lang,
  className 
}) => {
  // Define departments with their labels in both languages
  const departments = [
    { code: '', label: { en: 'None/Home', fr: 'Aucun/Accueil' } },
    { code: 'cra', label: { en: 'CRA', fr: 'ARC' } },
    { code: 'esdc', label: { en: 'ESDC', fr: 'EDSC' } },
    { code: 'ircc', label: { en: 'IRCC', fr: 'IRCC' } },
    { code: 'isc', label: { en: 'ISC', fr: 'SAC' } },
    { code: 'pspc', label: { en: 'PSPC', fr: 'SPAC' } }
  ];

  return (
    <div className={`department-selector ${className || ''}`}>
      <div className="department-buttons">
        {departments.map((dept) => (
          <GcdsButton
            key={dept.code}
            onClick={() => onDepartmentChange(dept.code)}
            variant={selectedDepartment === dept.code ? 'primary' : 'secondary'}
            className="department-button"
          >
            {dept.label[lang]}
          </GcdsButton>
        ))}
      </div>
    </div>
  );
};

export default DepartmentSelectorTesting;