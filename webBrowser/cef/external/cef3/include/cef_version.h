// Copyright (c) 2014 Marshall A. Greenblatt. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//    * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//    * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//    * Neither the name of Google Inc. nor the name Chromium Embedded
// Framework nor the names of its contributors may be used to endorse
// or promote products derived from this software without specific prior
// written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
// ---------------------------------------------------------------------------
//
// This file is generated by the make_version_header.py tool.
//

#ifndef CEF_INCLUDE_CEF_VERSION_H_
#define CEF_INCLUDE_CEF_VERSION_H_

#define CEF_VERSION_MAJOR 3
#define CEF_REVISION 1579
#define COPYRIGHT_YEAR 2014

#define CHROME_VERSION_MAJOR 34
#define CHROME_VERSION_MINOR 0
#define CHROME_VERSION_BUILD 1768
#define CHROME_VERSION_PATCH 0

#define DO_MAKE_STRING(p) #p
#define MAKE_STRING(p) DO_MAKE_STRING(p)

#ifndef APSTUDIO_HIDDEN_SYMBOLS

#ifdef __cplusplus
extern "C" {
#endif

#include "internal/cef_export.h"

// The API hash is created by analyzing CEF header files for C API type
// definitions. The hash value will change when header files are modified
// in a way that may cause binary incompatibility with other builds. The
// universal hash value will change if any platform is affected whereas the
// platform hash values will change only if that particular platform is
// affected.
#define CEF_API_HASH_UNIVERSAL "8236911b9f4831c6a7c76cc7cd11a807f77be069"
#if defined(OS_WIN)
#define CEF_API_HASH_PLATFORM "16f45043b6a63b1fb44ef0800e9ffd1f54538fd8"
#elif defined(OS_MACOSX)
#define CEF_API_HASH_PLATFORM "68ad95bf40d3c5f3b2406407f8d8fe0cbd00968f"
#elif defined(OS_LINUX)
#define CEF_API_HASH_PLATFORM "8b7bd5494ad6e411ccef02747a458c4e58e61eb1"
#endif

///
// Returns the CEF build revision for the libcef library.
///
CEF_EXPORT int cef_build_revision();

///
// Returns CEF version information for the libcef library. The |entry|
// parameter describes which version component will be returned:
// 0 - CEF_VERSION_MAJOR
// 1 - CEF_REVISION
// 2 - CHROME_VERSION_MAJOR
// 3 - CHROME_VERSION_MINOR
// 4 - CHROME_VERSION_BUILD
// 5 - CHROME_VERSION_PATCH
///
CEF_EXPORT int cef_version_info(int entry);

///
// Returns CEF API hashes for the libcef library. The returned string is owned
// by the library and should not be freed. The |entry| parameter describes which
// hash value will be returned:
// 0 - CEF_API_HASH_PLATFORM
// 1 - CEF_API_HASH_UNIVERSAL
///
CEF_EXPORT const char* cef_api_hash(int entry);

#ifdef __cplusplus
}
#endif

#endif  // APSTUDIO_HIDDEN_SYMBOLS

#endif  // CEF_INCLUDE_CEF_VERSION_H_
