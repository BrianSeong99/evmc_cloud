export const getDynamicLibraryExtension = () => {
    return process.platform === 'win32' ?
        'dll' :
        process.platform === 'darwin' ? 'dylib' : 'so';
};