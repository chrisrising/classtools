/* ClassTools launcher
   Sits at the top of the extracted folder and starts app\ClassTools.exe,
   so teachers see one icon instead of twenty-odd support files.      */
#define WIN32_LEAN_AND_MEAN
#include <windows.h>

#define BUF 2048

int WINAPI WinMain(HINSTANCE hi, HINSTANCE hp, LPSTR cmd, int show)
{
    static wchar_t self[BUF], dir[BUF], exe[BUF], cl[BUF + 4];
    DWORD n = GetModuleFileNameW(NULL, self, BUF);
    /* leave room for "\\app\\ClassTools.exe" and the quotes */
    if (n == 0 || n + 64 >= BUF) return 1;

    /* strip our own file name, leaving the folder we live in */
    while (n > 0 && self[n - 1] != L'\\') n--;
    if (n == 0) return 1;
    self[n - 1] = L'\0';

    lstrcpynW(dir, self, BUF);
    lstrcatW(dir, L"\\app");
    lstrcpynW(exe, dir, BUF);
    lstrcatW(exe, L"\\ClassTools.exe");

    if (GetFileAttributesW(exe) == INVALID_FILE_ATTRIBUTES) {
        MessageBoxW(NULL,
            L"ClassTools can't find its program files.\n\n"
            L"The \"app\" folder has to sit next to this icon. If you copied "
            L"just the icon somewhere, copy the whole folder instead \x2014 or "
            L"run \"Install to Start menu\" inside the app folder, which makes "
            L"a proper shortcut you can put anywhere.",
            L"ClassTools", MB_ICONERROR | MB_OK);
        return 1;
    }

    cl[0] = L'"'; cl[1] = L'\0';
    lstrcatW(cl, exe);
    lstrcatW(cl, L"\"");

    STARTUPINFOW si;
    PROCESS_INFORMATION pi;
    ZeroMemory(&si, sizeof si);
    ZeroMemory(&pi, sizeof pi);
    si.cb = sizeof si;

    if (!CreateProcessW(exe, cl, NULL, NULL, FALSE, 0, NULL, dir, &si, &pi)) {
        MessageBoxW(NULL, L"ClassTools couldn't be started.",
                    L"ClassTools", MB_ICONERROR | MB_OK);
        return 1;
    }
    CloseHandle(pi.hThread);
    CloseHandle(pi.hProcess);
    return 0;
}
