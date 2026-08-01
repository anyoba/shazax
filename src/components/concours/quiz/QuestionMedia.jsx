export default function QuestionMedia({ imageUrl }) {
  if (!imageUrl) return null;

  return (
    <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-slate-50">
      <img src={imageUrl} alt="Support visuel de la question" className="h-auto w-full object-cover" />
    </div>
  );
}
