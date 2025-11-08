const LoadingScreen = ({ message = 'Načítavam...' }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center z-[9999]">
      <div className="text-center flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        <p className="text-white text-lg font-semibold tracking-wide">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
