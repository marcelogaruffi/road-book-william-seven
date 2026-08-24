import React from 'react';

export function StageIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 3h20v18H2z" />
      <path d="M2 3c4 0 6 7 6 18" />
      <path d="M22 3c-4 0-6 7-6 18" />
      <path d="M8 21h8" />
      <path d="M2 3c3 4 7 4 10 0 3 4 7 4 10 0" />
    </svg>
  );
}

export function ClothesRackIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 2h4v2" />
      <path d="M3 9l2-5h4l2 5-1.5 5H4.5L3 9z" />
      <path d="M5 4l2 5 2-5" />
      <path d="M4.5 14h5V22H7.5l-1-4-1 4H4.5v-8z" />
      <path d="M15 2v3" />
      <path d="M19 2v3" />
      <path d="M14 5c1 1 2 2 3 2s2-1 3-2l1 5h-8l1-5z" />
      <path d="M14.5 10h5v1.5h-5z" />
      <path d="M14.5 11.5L12 22h10l-2.5-10.5" />
      <path d="M15 11.5L14 22" />
      <path d="M19 11.5L20 22" />
      <path d="M17 11.5v10.5" />
    </svg>
  );
}

export function StarDoorIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 22V4c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v18" />
      <path d="M2 22h20" />
      <polygon points="12 6 13.5 9 17 9.5 14.5 12 15 15.5 12 14 9 15.5 9.5 12 7 9.5 10.5 9" />
      <path d="M17 14v.01" />
    </svg>
  );
}
