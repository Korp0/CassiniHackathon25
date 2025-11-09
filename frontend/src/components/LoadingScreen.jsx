const LoadingScreen = ({ message = 'načítavam ...' }) => {
  return (
    <div className="fixed inset-0 bg-[#EEFCCE] flex items-center justify-center z-[9999]">
      <div className="text-center flex flex-col items-center gap-6">
        <img src="/logo.svg" alt="GeoQuest" className="w-28 h-28" />
        <div className="text-2xl font-bold text-gray-800">GeoQuest</div>

        <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin" aria-hidden="true"></div>
        <p className="text-gray-700 text-base font-medium">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
