# -*- mode: CMAKE; -*-

## -----------------------------------------------------------------------------
## --SECTION--                                                    COMMON DEFINES
## -----------------------------------------------------------------------------

################################################################################
### @brief required cmake version
################################################################################

cmake_minimum_required(VERSION 2.6)

################################################################################
### @brief cmake build types
################################################################################

if (NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE RelWithDebInfo CACHE string "Choose the type of build, options are: None Debug Release RelWithDebInfo MinSizeRel." FORCE)
endif ()

################################################################################
### @brief arangodb project
################################################################################

project(arangodb)

set(LIB_ARANGO        arango)
set(LIB_ARANGO_CLIENT arango_client)
set(LIB_ARANGO_V8     arango_v8)

set(BIN_ARANGOB       arangob)
set(BIN_ARANGOD       arangod)
set(BIN_ARANGODUMP    arangodump)
set(BIN_ARANGOIMP     arangoimp)
set(BIN_ARANGORESTORE arangorestore)
set(BIN_ARANGOSH      arangosh)

set(TEST_BASICS_SUITE basics_suite)
set(TEST_GEO_SUITE    geo_suite)

set(V8_VERSION        4.3.61)

set(ARANGODB_DISPLAY_NAME       "ArangoDB")
set(ARANGODB_URL_INFO_ABOUT     "http://www.arangodb.org")
set(ARANGODB_CONTACT            "hackers@arangodb.org")

set(ARANGODB_FRIENDLY_STRING    "ArangoDB - the multi-purpose database")
set(ARANGOB_FRIENDLY_STRING     "ArangoBench - stresstester")
set(ARANGO_DUMP_FRIENDLY_STRING "arangodump - export whole databases from ArangoDB to JSON")
set(ARANGO_IMP_FRIENDLY_STRING  "arangoimp - import CSV files into ArangoDB")
set(ARANGO_RESTORE_HELP_LINK    "arangrestore - import dumpfiles created with arangodump into ArangoDB")
set(ARANGOSH_HELP_LINK          "arangosh - commandline client of ArangoDB")


################################################################################
### @brief BUILD_PACKAGE
###
### Posible options are:
### - dmg-cli: Mac OS X shell client application
### - debian: debian package
### - raspbian: raspberry debian package
################################################################################

set(BUILD_PACKAGE "unknown" CACHE path "Package type to build")

################################################################################
### @brief GNU C/C++ compiler
################################################################################

if (CMAKE_COMPILER_IS_GNUCC)
  set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -std=gnu89 -g")
  set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -g")
endif ()

if (CMAKE_COMPILER_IS_GNUCXX)
  set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11 -g")
endif ()

if (APPLE)
  set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11 -g")
  add_definitions("-Wno-deprecated-declarations")
endif ()

################################################################################
### @brief Visual Studio Compiler
################################################################################

if (MSVC)
  add_definitions("-D_CRT_SECURE_NO_WARNINGS=1")
  add_definitions("-DFD_SETSIZE=2048")
  add_definitions("-DUSE_REGEX_STATIC=1")
  add_definitions("-DU_STATIC_IMPLEMENTATION=1")

  foreach (flag_var
	   CMAKE_C_FLAGS
	   CMAKE_C_FLAGS_DEBUG
	   CMAKE_C_FLAGS_RELEASE
	   CMAKE_C_FLAGS_MINSIZEREL
	   CMAKE_C_FLAGS_RELWITHDEBINFO
           CMAKE_CXX_FLAGS
           CMAKE_CXX_FLAGS_DEBUG
           CMAKE_CXX_FLAGS_RELEASE
           CMAKE_CXX_FLAGS_MINSIZEREL
           CMAKE_CXX_FLAGS_RELWITHDEBINFO)
    if (${flag_var} MATCHES "/MD")
      string(REGEX REPLACE "/MDd?" "" ${flag_var} "${${flag_var}}")
    endif()

    if (flag_var MATCHES "DEBUG")
      set(${flag_var} "${${flag_var}} /MTd")
    else ()
      set(${flag_var} "${${flag_var}} /MT")
    endif ()
  endforeach()

  set(MSVC_LIBS crypt32.lib;WINMM.LIB;Ws2_32.lib;getopt;regex)

  set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} /SUBSYSTEM:CONSOLE /LTCG /SAFESEH:NO /ignore:4099")
endif ()

################################################################################
### @brief TRI_BITS
################################################################################

math(EXPR BITS "8*${CMAKE_SIZEOF_VOID_P}")
add_definitions("-DTRI_BITS=${BITS}")

################################################################################
### @brief raspberry pi
################################################################################

if (BUILD_PACKAGE STREQUAL "raspbian")
  add_definitions("-DTRI_FORCE_ARMV6")
  option(RASPBIAN "Building for Raspberry PI" ON)
else ()
  option(RASPBIAN "Building for Raspberry PI" OFF)
endif ()

################################################################################
### @brief darwin
################################################################################

if (BUILD_PACKAGE STREQUAL "dmg-cli")
  option(DARWIN "Building for MacOS" ON)
else ()
  option(DARWIN "Building for MacOS" OFF)
endif ()


## -----------------------------------------------------------------------------
## --SECTION--                                                           OPTIONS
## -----------------------------------------------------------------------------

################################################################################
### @brief ARANGODB_VERSION
################################################################################

set(ARANGODB_VERSION "1.x.y-rc1" CACHE path "ArangoDB version")

################################################################################
### @brief VISTA LOCKS
################################################################################

option(USE_VISTA_LOCKS "Do you want to use Windows Vista R/W locks" OFF)

if (USE_VISTA_LOCKS)
  add_definitions("-DTRI_WINDOWS_VISTA_LOCKS=1")
endif ()

## -----------------------------------------------------------------------------
## --SECTION--                                                       DIRECTORIES
## -----------------------------------------------------------------------------

################################################################################
### @brief Enable Backtrace
################################################################################

option(USE_BACKTRACE "whether we should try to generate c-level stacktraces" OFF)
if (USE_BACKTRACE)
  if (MSVC)
    set(BT_LIBS "Dbghelp" CACHE path "Debug Helper libraries")
  else ()
    set(BT_LIBS "" CACHE path "Debug Helper libraries")
  endif()
  add_definitions("-DHAVE_BACKTRACE=1")
else()
  set(BT_LIBS "" CACHE path "Debug Helper libraries")
endif()

################################################################################
### @brief Enable Backtrace
################################################################################

option(USE_MAINTAINER_MODE "whether we want to have assertions and other development features" OFF)
if (USE_MAINTAINER_MODE)
  add_definitions("-DTRI_ENABLE_MAINTAINER_MODE=1")
endif()

################################################################################
### @brief Enable Relative
################################################################################

option(USE_RELATIVE "Do you want to have all path are relative to the binary" OFF)

if (USE_RELATIVE)

  ################################################################################
  ### @brief SYSTEM CONFIGURATION DIRECTORY (/etc)
  ################################################################################

  set(ETCDIR_NATIVE "./etc/relative")
  set(ETCDIR_INSTALL "etc/relative")

  file(TO_NATIVE_PATH "${ETCDIR_NATIVE}" ETCDIR_NATIVE)
  STRING(REGEX REPLACE "\\\\" "\\\\\\\\" ETCDIR_ESCAPED "${ETCDIR_NATIVE}")

  add_definitions("-D_SYSCONFDIR_=\"${ETCDIR_ESCAPED}\"")

  ################################################################################
  ### @brief DATA DIRECTORY (/var)
  ################################################################################

  set(VARDIR "" CACHE path "System configuration directory (defaults to prefix/var/arangodb)")

  if (VARDIR STREQUAL "")
    set(VARDIR_NATIVE "${CMAKE_INSTALL_PREFIX}/var")
    set(VARDIR_INSTALL "var")
  else ()
    set(VARDIR_NATIVE "${VARDIR}")
    set(VARDIR_INSTALL "${VARDIR}")
  endif ()

  file(TO_NATIVE_PATH "${VARDIR_NATIVE}" VARDIR_NATIVE)

  ################################################################################
  ### @brief database directory
  ################################################################################

  FILE(MAKE_DIRECTORY "${PROJECT_BINARY_DIR}/var/lib/arangodb")

  ################################################################################
  ### @brief apps directory
  ################################################################################

  FILE(MAKE_DIRECTORY "${PROJECT_BINARY_DIR}/var/lib/arangodb-apps")

  ################################################################################
  ### @brief log directory
  ################################################################################

  FILE(MAKE_DIRECTORY "${PROJECT_BINARY_DIR}/var/log/arangodb")

  ################################################################################
  ### @brief TRI_PKGDATADIR
  ################################################################################

  set(TRI_PKGDATADIR "${CMAKE_INSTALL_PREFIX}/share/arangodb")

  ################################################################################
  ### @brief TRI_RESOURCEDIR
  ################################################################################

  set(TRI_RESOURCEDIR "resources")

  ################################################################################
  ### @brief TRI_BINDIR
  ################################################################################

  set(TRI_BINDIR_INSTALL "bin")
  set(TRI_BINDIR "${CMAKE_INSTALL_PREFIX}/bin")

  ################################################################################
  ### @brief TRI_SBINDIR
  ################################################################################

  if (MSVC)
    set(TRI_SBINDIR_INSTALL "bin")
    set(TRI_SBINDIR "${CMAKE_INSTALL_PREFIX}/bin")
  else ()
    set(TRI_SBINDIR_INSTALL "sbin")
    set(TRI_SBINDIR "${CMAKE_INSTALL_PREFIX}/sbin")
  endif ()

else() # USE_RELATIVE

  ################################################################################
  ### @brief SYSTEM CONFIGURATION DIRECTORY (/etc)
  ################################################################################

  set(ETCDIR "" CACHE path "System configuration directory (defaults to prefix/etc)")

  if (ETCDIR STREQUAL "")
    set(ETCDIR_NATIVE "${CMAKE_INSTALL_PREFIX}/etc/arangodb")
    set(ETCDIR_INSTALL "etc/arangodb")
  else ()
    set(ETCDIR_NATIVE "${ETCDIR}/arangodb")
    set(ETCDIR_INSTALL "${ETCDIR}/arangodb")
  endif ()


  if (MSVC)
    file(TO_NATIVE_PATH "${ETCDIR_INSTALL}" ETCDIR_INSTALL)
    STRING(REGEX REPLACE "\\\\" "\\\\\\\\" ETCDIR_ESCAPED "${ETCDIR_INSTALL}")
  else ()
    file(TO_NATIVE_PATH "${ETCDIR_NATIVE}" ETCDIR_NATIVE)
    STRING(REGEX REPLACE "\\\\" "\\\\\\\\" ETCDIR_ESCAPED "${ETCDIR_NATIVE}")
  endif()

  add_definitions("-D_SYSCONFDIR_=\"${ETCDIR_ESCAPED}\"")

  ################################################################################
  ### @brief DATA DIRECTORY (/var)
  ################################################################################

  set(VARDIR "" CACHE path "System configuration directory (defaults to prefix/var/arangodb)")

  if (VARDIR STREQUAL "")
    set(VARDIR_NATIVE "${CMAKE_INSTALL_PREFIX}/var")
    set(VARDIR_INSTALL "var")
  else ()
    set(VARDIR_NATIVE "${VARDIR}")
    set(VARDIR_INSTALL "${VARDIR}")
  endif ()

  file(TO_NATIVE_PATH "${VARDIR_NATIVE}" VARDIR_NATIVE)


  ################################################################################
  ### @brief database directory
  ################################################################################

  FILE(MAKE_DIRECTORY "${PROJECT_BINARY_DIR}/var/lib/arangodb")

  ################################################################################
  ### @brief apps directory
  ################################################################################

  FILE(MAKE_DIRECTORY "${PROJECT_BINARY_DIR}/var/lib/arangodb-apps")

  ################################################################################
  ### @brief log directory
  ################################################################################

  FILE(MAKE_DIRECTORY "${PROJECT_BINARY_DIR}/var/log/arangodb")

  ################################################################################
  ### @brief TRI_PKGDATADIR
  ################################################################################

  set(TRI_PKGDATADIR "${CMAKE_INSTALL_PREFIX}/share/arangodb")

  ################################################################################
  ### @brief TRI_RESOURCEDIR
  ################################################################################

  set(TRI_RESOURCEDIR "resources")

  ################################################################################
  ### @brief TRI_BINDIR
  ################################################################################

  if (MSVC)
    set(TRI_BINDIR_INSTALL "bin")
    set(TRI_BINDIR "${CMAKE_INSTALL_PREFIX}/bin")
  else ()
    set(TRI_BINDIR_INSTALL "bin")
    set(TRI_BINDIR "${CMAKE_INSTALL_PREFIX}/bin")
  endif ()

  ################################################################################
  ### @brief TRI_SBINDIR
  ################################################################################

  if (MSVC)
    set(TRI_SBINDIR_INSTALL "bin")
    set(TRI_SBINDIR "${CMAKE_INSTALL_PREFIX}/bin")
  else ()
    set(TRI_SBINDIR_INSTALL "sbin")
    set(TRI_SBINDIR "${CMAKE_INSTALL_PREFIX}/sbin")
  endif ()

endif () # USE_RELATIVE

if (MSVC)
  ################################################################################
  ### @brief icon paths for windows
  ################################################################################
  file(TO_NATIVE_PATH "${TRI_RESOURCEDIR}/Icons/arangodb.ico" RELATIVE_ARANGO_ICON)
  file(TO_NATIVE_PATH "${PROJECT_SOURCE_DIR}/Installation/Windows/Icons/arangodb.bmp" ARANGO_IMG)
  file(TO_NATIVE_PATH "${PROJECT_SOURCE_DIR}/Installation/Windows/Icons/arangodb.ico" ARANGO_ICON)

  STRING(REGEX REPLACE "\\\\" "\\\\\\\\" ARANGO_IMG "${ARANGO_IMG}")
  STRING(REGEX REPLACE "\\\\" "\\\\\\\\" ARANGO_ICON "${ARANGO_ICON}")
  STRING(REGEX REPLACE "\\\\" "\\\\\\\\" RELATIVE_ARANGO_ICON "${RELATIVE_ARANGO_ICON}")


  ################################################################################
  ### @brief Versioning for windows
  ################################################################################

  set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} ${PROJECT_SOURCE_DIR}/Installation/Windows/version)
  include("${PROJECT_SOURCE_DIR}/Installation/Windows/version/generate_product_version.cmake")

endif ()


################################################################################
### @brief etcd
################################################################################

if (DARWIN)
  install(PROGRAMS ${PROJECT_SOURCE_DIR}/bin/etcd-arango
          DESTINATION ${TRI_BINDIR_INSTALL})
endif ()

## -----------------------------------------------------------------------------
## --SECTION--                                                   COMMON INCLUDES
## -----------------------------------------------------------------------------

################################################################################
### @brief project source
################################################################################

include_directories(${PROJECT_SOURCE_DIR})

if (CUSTOM_INCLUDES)
  include_directories(${CUSTOM_INCLUDES})
endif()

## -----------------------------------------------------------------------------
## --SECTION--                                                     COMMON MACROS
## -----------------------------------------------------------------------------

################################################################################
### @brief generates config file using ROOTDIR
################################################################################

macro (generate_root_config name)
  FILE(READ ${PROJECT_SOURCE_DIR}/etc/arangodb/${name}.conf.in FileContent)

  STRING(REPLACE "@PKGDATADIR@" "@ROOTDIR@/share/arangodb" 
         FileContent "${FileContent}")

  STRING(REPLACE "@LOCALSTATEDIR@" "@ROOTDIR@/var"
         FileContent "${FileContent}")

  STRING(REPLACE "@SBINDIR@" "@ROOTDIR@/bin"
         FileContent "${FileContent}")

  STRING(REPLACE "@LIBEXECDIR@/arangodb" "@ROOTDIR@/bin"
         FileContent "${FileContent}")

  STRING(REPLACE "@SYSCONFDIR@" "@ROOTDIR@/etc/arangodb"
         FileContent "${FileContent}")

  if (MSVC)
    STRING(REPLACE "@PROGRAM_SUFFIX@" ".exe"
           FileContent "${FileContent}")

    STRING(REGEX REPLACE "[\r\n]file =" "\n# file =" 
           FileContent "${FileContent}")
  endif ()

  FILE(WRITE ${PROJECT_BINARY_DIR}/etc/arangodb/${name}.conf "${FileContent}")
endmacro ()

################################################################################
### @brief generates config file using the configured paths
################################################################################

macro (generate_path_config name)
  FILE(READ ${PROJECT_SOURCE_DIR}/etc/arangodb/${name}.conf.in FileContent)

  STRING(REPLACE "@PKGDATADIR@" "${TRI_PKGDATADIR}" 
         FileContent "${FileContent}")

  STRING(REPLACE "@LOCALSTATEDIR@" "${VARDIR_NATIVE}" 
         FileContent "${FileContent}")

  if ((${name} STREQUAL "arangod") AND RASPBIAN)
    STRING(REGEX REPLACE "[\r\n]threads =[^\r\n]*" "\nthreads = 1" 
           FileContent "${FileContent}")

    STRING(REGEX REPLACE "[\r\n]v8-contexts =[^\r\n]*" "\n8-contexts = 1" 
           FileContent "${FileContent}")
  endif ()

  FILE(WRITE ${PROJECT_BINARY_DIR}/etc/arangodb/${name}.conf "${FileContent}")
endmacro ()

################################################################################
### @brief installs a config file
################################################################################

macro (install_config name)
  if (MSVC OR DARWIN)
    generate_root_config(${name})
  else ()
    generate_path_config(${name})
  endif ()

  install(
    FILES ${PROJECT_BINARY_DIR}/etc/arangodb/${name}.conf
    DESTINATION ${ETCDIR_INSTALL})
endmacro ()

################################################################################
### @brief installs a readme file converting EOL
################################################################################

macro (install_readme input where output)
  FILE(READ ${PROJECT_SOURCE_DIR}/${input} FileContent)

  STRING(REPLACE "\r" "" FileContent "${FileContent}")

  if (MSVC)
    STRING(REPLACE "\n" "\r\n" FileContent "${FileContent}")
  endif ()

  FILE(WRITE ${PROJECT_BINARY_DIR}/${output} "${FileContent}")

  install(
    FILES ${PROJECT_BINARY_DIR}/${output}
    DESTINATION ${where})
endmacro ()

################################################################################
### @brief installs a link to an executable
################################################################################

macro (install_command_alias name where alias)
  if (MSVC)

  add_custom_command(
    TARGET ${name}
    POST_BUILD
      COMMAND 
	${CMAKE_COMMAND} -E copy
	  $<TARGET_FILE:${name}>
	  ${CMAKE_RUNTIME_OUTPUT_DIRECTORY}/${alias}.exe)

    install(
      PROGRAMS ${CMAKE_RUNTIME_OUTPUT_DIRECTORY}/${alias}.exe
      DESTINATION ${where})

  else ()

  add_custom_command(
    TARGET ${name}
    POST_BUILD
      COMMAND 
	${CMAKE_COMMAND} -E create_symlink
	  ${name}
	  ${CMAKE_RUNTIME_OUTPUT_DIRECTORY}/${alias})

    install(
      PROGRAMS ${CMAKE_RUNTIME_OUTPUT_DIRECTORY}/${alias}
      DESTINATION ${where})

  endif ()
endmacro ()

## -----------------------------------------------------------------------------
## --SECTION--                                                EXTERNAL LIBRARIES
## -----------------------------------------------------------------------------

################################################################################
### @brief threads
################################################################################

find_package(Threads)

################################################################################
### @brief windows
################################################################################

if (MSVC)
  set(MSVC_INCLUDE ${PROJECT_SOURCE_DIR}/WindowsLibraries/${BITS}/include CACHE path "MSVC 3rd party include path")
  set(MSVC_LIB_PATH ${PROJECT_SOURCE_DIR}/WindowsLibraries/${BITS}/lib CACHE path "MSVC 3rd party library path")
endif ()

if (MSVC_INCLUDE)
  include_directories(${MSVC_INCLUDE})
endif ()

if (MSVC_LIB_PATH)
  link_directories(${MSVC_LIB_PATH})
endif ()

################################################################################
### @brief raspberry pi
################################################################################

if (RASPBIAN)
  set(ARM_INCLUDE ${PROJECT_SOURCE_DIR}/ArmLibraries/include CACHE path "ARM 3rd party include path")
  set(ARM_LIB_PATH ${PROJECT_SOURCE_DIR}/ArmLibraries/lib CACHE path "ARM 3rd party library path")
endif ()

if (ARM_INCLUDE)
  include_directories(${ARM_INCLUDE})
endif ()

if (ARM_LIB_PATH)
  link_directories(${ARM_LIB_PATH})
endif ()

################################################################################
### @brief ICU
################################################################################

if (MSVC)
  set(ICU_LIBS "icui18n;icuuc" CACHE path "ICU libraries")

  add_definitions("-DU_STATIC_IMPLEMENTATION=1")
elseif (RASPBIAN)
  set(ICU_LIBS icui18n;icuuc;icudata;pthread;dl;m CACHE path "ICU libraries")
elseif (DARWIN)
  set(ICU_INCLUDE ${PROJECT_SOURCE_DIR}/3rdParty/V8-${V8_VERSION}/third_party/icu/source/common;${PROJECT_SOURCE_DIR}/3rdParty/V8-${V8_VERSION}/third_party/icu/source/i18n;${PROJECT_SOURCE_DIR}/3rdParty/V8-${V8_VERSION}/third_party/icu/source/io CACHE path "ICU include path")
  set(ICU_LIB_PATH ${PROJECT_SOURCE_DIR}/3rdParty/V8-${V8_VERSION}/out/x64.release CACHE path "ICU library path")
  set(ICU_LIBS icui18n;icuuc;icudata;pthread;dl;m CACHE path "ICU libraries")
else ()
  set(ICU_INCLUDE ${PROJECT_SOURCE_DIR}/3rdParty/V8-${V8_VERSION}/third_party/icu/source/common;${PROJECT_SOURCE_DIR}/3rdParty/V8-${V8_VERSION}/third_party/icu/source/i18n;${PROJECT_SOURCE_DIR}/3rdParty/V8-${V8_VERSION}/third_party/icu/source/io CACHE path "ICU include path")
  set(ICU_LIB_PATH ${PROJECT_SOURCE_DIR}/3rdParty/V8-${V8_VERSION}/out/x64.release/obj.target/third_party/icu/ CACHE path "ICU library path")
  set(ICU_LIBS icui18n;icuuc;icudata;pthread;dl;m CACHE path "ICU libraries")
endif ()

if (ICU_INCLUDE)
  include_directories(${ICU_INCLUDE})
endif ()

if (ICU_LIB_PATH)
  link_directories(${ICU_LIB_PATH})
endif ()

################################################################################
### @brief BOOST
################################################################################

set(BOOST_VERSION "1.58.0" CACHE string "BOOST version")

set(BOOST_INCLUDE ${PROJECT_SOURCE_DIR}/3rdParty/boost/${BOOST_VERSION} CACHE path "BOOST include path")

if (BOOST_INCLUDE)
  include_directories(${BOOST_INCLUDE})
endif ()

################################################################################
### @brief LIBEV
################################################################################

set(LIBEV_VERSION "unknown" CACHE string "LIBEV version")

if (MSVC OR RASPBIAN) 
  set(LIBEV_LIBS ev CACHE string "LIBEV libraries")
else ()
  set(LIBEV_INCLUDE ${PROJECT_SOURCE_DIR}/3rdParty/libev CACHE path "LIBEV include path")
  set(LIBEV_LIB_PATH ${PROJECT_SOURCE_DIR}/3rdParty/libev/BUILD/.libs CACHE path "LIBEV library path")
  set(LIBEV_LIBS ev CACHE string "LIBEV libraries")
endif ()

if (LIBEV_INCLUDE)
  include_directories(${LIBEV_INCLUDE})
endif ()

if (LIBEV_LIB_PATH)
  link_directories(${LIBEV_LIB_PATH})
endif ()

add_definitions("-DTRI_LIBEV_VERSION=\"${LIBEV_VERSION}\"")

################################################################################
### @brief OPENSSL
################################################################################

if (MSVC)
  set(OPENSSL_LIBS ssleay;libeay CACHE string "OPENSSL libraries")
elseif (RASPBIAN)
  set(OPENSSL_LIBS ssl;crypto CACHE string "OPENSSL libraries")
else ()
  set(OPENSSL_INCLUDE "" CACHE path "OPENSSL include path")
  set(OPENSSL_LIB_PATH "" CACHE path "OPENSSL library path")
  set(OPENSSL_LIBS ssl;crypto CACHE string "OPENSSL libraries")
endif ()

if (OPENSSL_INCLUDE)
  include_directories(${OPENSSL_INCLUDE})
endif ()

if (OPENSSL_LIB_PATH)
  link_directories(${OPENSSL_LIB_PATH})
endif ()

################################################################################
### @brief LINENOISE
################################################################################

if (MSVC)
  set(LINENOISE_LIBS linenoise CACHE string "LINENOISE libraries")
  set(LINENOISE_VERSION "linenoise" CACHE string "LINENOISE version")
else ()
  set(LINENOISE_INCLUDE "" CACHE path "LINENOISE include path")
  set(LINENOISE_LIB_PATH "" CACHE path "LINENOISE library path")
  set(LINENOISE_LIBS readline CACHE string "LINENOISE libraries")
  set(LINENOISE_VERSION "unknown" CACHE string "LINENOISE version")
endif ()

if (LINENOISE_INCLUDE)
  include_directories(${LINENOISE_INCLUDE})
endif ()

if (LINENOISE_LIB_PATH)
  link_directories(${LINENOISE_LIB_PATH})
endif ()

################################################################################
### @brief V8
################################################################################

set(V8_VERSION "unknown" CACHE string "V8 version")

if (MSVC OR RASPBIAN)
  set(V8_LIBS v8_base;v8_libbase;v8_libplatform;v8_nosnapshot CACHE string "V8 libraries")
elseif (DARWIN)
  set(V8_INCLUDE ${PROJECT_SOURCE_DIR}/3rdParty/V8-${V8_VERSION}/include CACHE path "V8 include path")
  set(V8_LIB_PATH ${PROJECT_SOURCE_DIR}/3rdParty/V8-${V8_VERSION}/out/x64.release CACHE path "V8 library path")
  set(V8_LIBS v8_base;v8_libbase;v8_libplatform;v8_nosnapshot CACHE string "V8 libraries")
else ()
  set(V8_INCLUDE ${PROJECT_SOURCE_DIR}/3rdParty/V8-${V8_VERSION}/include CACHE path "V8 include path")
  set(V8_LIB_PATH ${PROJECT_SOURCE_DIR}/3rdParty/V8-${V8_VERSION}/out/x64.release/obj.target/tools/gyp CACHE path "V8 library path")
  set(V8_LIBS v8_base;v8_libbase;v8_libplatform;v8_nosnapshot CACHE string "V8 libraries")
endif ()

if (V8_INCLUDE)
  include_directories(${V8_INCLUDE})
endif ()

if (V8_LIB_PATH)
  link_directories(${V8_LIB_PATH})
endif ()

add_definitions("-DTRI_V8_VERSION=\"${V8_VERSION}\"")

################################################################################
### @brief ZLIB
################################################################################

set(ZLIB_VERSION "unknown" CACHE string "ZLIB version")

if (MSVC OR RASPBIAN)
  set(ZLIB_LIBS z CACHE string "ZLIB libraries")
else ()
  set(ZLIB_INCLUDE ${PROJECT_SOURCE_DIR}/3rdParty/zlib-1.2.7 CACHE path "ZLIB include path")
  set(ZLIB_LIB_PATH ${PROJECT_SOURCE_DIR}/3rdParty/zlib-1.2.7 CACHE path "ZLIB library path")
  set(ZLIB_LIBS z CACHE string "ZLIB libraries")
endif ()

if (ZLIB_INCLUDE)
  include_directories(${ZLIB_INCLUDE})
endif ()

if (ZLIB_LIB_PATH)
  link_directories(${ZLIB_LIB_PATH})
endif ()

add_definitions("-DTRI_ZLIB_VERSION=\"${ZLIB_VERSION}\"")

## -----------------------------------------------------------------------------
## --SECTION--                                                      SUB-PROJECTS
## -----------------------------------------------------------------------------

################################################################################
### @brief lib
################################################################################

add_subdirectory(lib)

################################################################################
### @brief arangosh
################################################################################

add_subdirectory(arangosh)

################################################################################
### @brief arangod
################################################################################

add_subdirectory(arangod)

## -----------------------------------------------------------------------------
## --SECTION--                                                    DOCUMENTATIONS
## -----------------------------------------------------------------------------

################################################################################
### @brief install manual
################################################################################

install(DIRECTORY ${PROJECT_SOURCE_DIR}/Documentation/man/
        DESTINATION share/man)

################################################################################
### @brief install arangod readme
################################################################################

if (MSVC)
  install_readme(README . README.txt)
  install_readme(README.md . README.md)
  install_readme(README.windows . README.windows.txt)
endif ()

################################################################################
### @brief install arangod license
################################################################################

if (MSVC)
  install_readme(LICENSE . LICENSE.txt)
endif ()

## -----------------------------------------------------------------------------
## --SECTION--                                                             TESTS
## -----------------------------------------------------------------------------

################################################################################
### @brief enable testing
################################################################################

enable_testing()

################################################################################
### @brief load test definition
################################################################################

add_subdirectory(UnitTests)

## -----------------------------------------------------------------------------
## --SECTION--                                                          PACKAGES
## -----------------------------------------------------------------------------

################################################################################
### @brief general information
################################################################################

if (MSVC)
else ()
  set(CPACK_SET_DESTDIR ON)
endif ()

set(CPACK_PACKAGE_VENDOR  "ArangoDB GmbH")
set(CPACK_PACKAGE_CONTACT "info@arangodb.org")
set(CPACK_PACKAGE_VERSION "${ARANGODB_VERSION}")

set(CPACK_RESOURCE_FILE_LICENSE "${PROJECT_SOURCE_DIR}/LICENSE")

set(CPACK_STRIP_FILES "ON")

if (DARWIN)
  set(CPACK_PACKAGE_NAME "ArangoDB-CLI")
elseif (RASPBIAN)
  set(CPACK_PACKAGE_NAME "arangodb")
elseif (BUILD_PACKAGE STREQUAL "debian")
  set(CPACK_PACKAGE_NAME "arangodb")
elseif (MSVC)
  set(CPACK_PACKAGE_NAME "ArangoDB")
endif ()

################################################################################
### @brief debian package
################################################################################

if ((BUILD_PACKAGE STREQUAL "debian") OR RASPBIAN)
  if (RASPBIAN)
    set(CPACK_SYSTEM_NAME "raspbian")
  endif ()

  set(CPACK_DEBIAN_PACKAGE_SECTION "database")
  set(CPACK_DEBIAN_PACKAGE_CONTROL_EXTRA 
    "${PROJECT_SOURCE_DIR}/Installation/ARM/postinst;${PROJECT_SOURCE_DIR}/Installation/ARM/preinst;${PROJECT_SOURCE_DIR}/Installation/ARM/postrm;${PROJECT_SOURCE_DIR}/Installation/ARM/prerm;")

  install(
    FILES ${PROJECT_SOURCE_DIR}/Installation/ARM/rc.arangodb
    PERMISSIONS OWNER_READ OWNER_EXECUTE GROUP_READ GROUP_EXECUTE WORLD_READ WORLD_EXECUTE
    DESTINATION /etc/init.d
    RENAME arangodb)

  install(
    CODE
      "EXECUTE_PROCESS(COMMAND ${CMAKE_COMMAND} -E make_directory \$ENV{DESTDIR}/${CMAKE_INSTALL_PREFIX}/share/arangodb/js/apps)")

  install(
    CODE
      "EXECUTE_PROCESS(COMMAND ${CMAKE_COMMAND} -E create_symlink /var/lib/arangodb-apps \$ENV{DESTDIR}/${CMAKE_INSTALL_PREFIX}/share/arangodb/js/apps/databases)")
endif ()

################################################################################
### @brief MacOSX bundle
################################################################################

if (DARWIN)
  set(CPACK_BUNDLE_NAME            "${CPACK_PACKAGE_NAME}")
  set(CPACK_BUNDLE_PLIST           "${PROJECT_SOURCE_DIR}/Installation/MacOSX/Bundle/Info.plist")
  set(CPACK_BUNDLE_ICON            "${PROJECT_SOURCE_DIR}/Installation/MacOSX/Bundle/icon.icns")
  set(CPACK_BUNDLE_STARTUP_COMMAND "${PROJECT_SOURCE_DIR}/Installation/MacOSX/Bundle/arangodb-cli.sh")
endif ()

################################################################################
### @brief Micrsoft Installer
################################################################################

if (MSVC)

  ##############################################################################
  ## Initializing variables
  ## to be substituted into Installation/Windows/Templates/NSIS.template.in
  ##############################################################################

  set(CPACK_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/Installation/Windows/Templates")
  set(CPACK_NSIS_ENABLE_UNINSTALL_BEFORE_INSTALL 1)
  set(BITS 64)

  if(CMAKE_CL_64)
    SET(CPACK_NSIS_INSTALL_ROOT "$PROGRAMFILES64")
    SET(BITS 64)
  else()
    SET(CPACK_NSIS_INSTALL_ROOT "$PROGRAMFILES")
    SET(BITS 32)
  endif()

  

  message(STATUS "ARANGO_IMG:  ${ARANGO_IMG}")
  message(STATUS "ARANGO_ICON: ${ARANGO_ICON}")
  message(STATUS "RELATIVE_ARANGO_ICON: ${RELATIVE_ARANGO_ICON}")

  install(
    DIRECTORY "${PROJECT_SOURCE_DIR}/Installation/Windows/Icons"
    DESTINATION ${TRI_RESOURCEDIR})

  set(CPACK_NSIS_DEFINES "
    !define BITS ${BITS}
    !define TRI_FRIENDLY_SVC_NAME '${ARANGODB_FRIENDLY_STRING}'
    !define TRI_AARDVARK_URL 'http://127.0.0.1:8529'
    ")

  set(CPACK_PACKAGE_ICON             ${ARANGO_ICON})

  set(CPACK_NSIS_MODIFY_PATH         ON)
  set(CPACK_NSIS_MUI_ICON            ${ARANGO_ICON})
  set(CPACK_NSIS_MUI_UNIICON         ${ARANGO_ICON})
  set(CPACK_NSIS_INSTALLED_ICON_NAME ${RELATIVE_ARANGO_ICON})
  set(CPACK_NSIS_DISPLAY_NAME,       ${ARANGODB_DISPLAY_NAME})
  set(CPACK_NSIS_HELP_LINK           ${ARANGODB_HELP_LINK})
  set(CPACK_NSIS_URL_INFO_ABOUT      ${ARANGODB_URL_INFO_ABOUT})
  set(CPACK_NSIS_CONTACT             ${ARANGODB_CONTACT})

  ##############################################################################
  ## etcd
  ##############################################################################

  if(CMAKE_CL_64)
    install(PROGRAMS WindowsLibraries/64/bin/etcd-arango.exe
            DESTINATION ${TRI_SBINDIR_INSTALL})

    install(FILES WindowsLibraries/64/icudtl.dat
            DESTINATION share/arangodb
            RENAME icudt54l.dat)
  else()
    install(PROGRAMS WindowsLibraries/32/bin/etcd-arango.exe
            DESTINATION ${TRI_SBINDIR_INSTALL})

    install(FILES WindowsLibraries/32/icudtl.dat
            DESTINATION share/arangodb
            RENAME icudt54l.dat)
  endif()

endif ()

################################################################################
### @brief use CPack
################################################################################

include(CPack)

## -----------------------------------------------------------------------------
## --SECTION--                                                       END-OF-FILE
## -----------------------------------------------------------------------------

## Local Variables:
## mode: outline-minor
## outline-regexp: "### @brief\\|## --SECTION--\\|# -\\*- "
## End:
