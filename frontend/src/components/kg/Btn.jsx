import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';

export default function Btn({
  variant = 'default', size, icon, iconRight,
  children, style, to, onClick, type = 'button', disabled, className = '',
}) {
  const navigate = useNavigate();
  const cls = ['btn'];
  if (variant === 'primary') cls.push('btn-primary');
  if (variant === 'ghost')   cls.push('btn-ghost');
  if (variant === 'danger')  cls.push('btn-danger');
  if (size === 'sm')         cls.push('btn-sm');
  if (className)             cls.push(className);

  const handle = (e) => {
    if (onClick) onClick(e);
    if (to) navigate(to);
  };

  return (
    <button type={type} className={cls.join(' ')} style={style} onClick={handle} disabled={disabled}>
      {icon && <Icon name={icon} size={14} />}
      {children}
      {iconRight && <Icon name={iconRight} size={14} />}
    </button>
  );
}
