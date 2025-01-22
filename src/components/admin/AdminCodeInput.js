import React from 'react';

const AdminCodeInput = ({ code, onChange, correctCode, label }) => {
  return (
    <div className="admin-code-input mrgn-bttm-20">
      <label htmlFor="adminCode" className="mrgn-bttm-10 display-block">
        {label || 'Enter Admin Code to enable access:'}
      </label>
      <input type="text" id="adminCode" value={code} onChange={onChange} className="mrgn-bttm-10" />
    </div>
  );
};

export default AdminCodeInput;
