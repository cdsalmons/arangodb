////////////////////////////////////////////////////////////////////////////////
/// @brief Aql, collections
///
/// @file
///
/// DISCLAIMER
///
/// Copyright 2014 ArangoDB GmbH, Cologne, Germany
/// Copyright 2004-2014 triAGENS GmbH, Cologne, Germany
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///
/// Copyright holder is ArangoDB GmbH, Cologne, Germany
///
/// @author Jan Steemann
/// @author Copyright 2014, ArangoDB GmbH, Cologne, Germany
/// @author Copyright 2012-2013, triAGENS GmbH, Cologne, Germany
////////////////////////////////////////////////////////////////////////////////

#ifndef ARANGODB_AQL_COLLECTIONS_H
#define ARANGODB_AQL_COLLECTIONS_H 1

#include "Basics/Common.h"
#include "VocBase/transaction.h"

struct TRI_vocbase_t;

namespace triagens {
  namespace aql {
    struct Collection;

// -----------------------------------------------------------------------------
// --SECTION--                                                 class Collections
// -----------------------------------------------------------------------------

    class Collections {

      public:

        Collections& operator= (Collections const& other) = delete;
      
        Collections (TRI_vocbase_t*); 
      
        ~Collections ();

      public:

        Collection* get (std::string const&) const;

        Collection* add (std::string const&,
                         TRI_transaction_type_e);

        std::vector<std::string> collectionNames () const;

        std::map<std::string, Collection*>* collections ();
        
        std::map<std::string, Collection*> const* collections () const;

      private:

        TRI_vocbase_t*                      _vocbase;

        std::map<std::string, Collection*>  _collections;

        static size_t const                 MaxCollections = 32;
    };

  }
}

#endif

// -----------------------------------------------------------------------------
// --SECTION--                                                       END-OF-FILE
// -----------------------------------------------------------------------------

// Local Variables:
// mode: outline-minor
// outline-regexp: "/// @brief\\|/// {@inheritDoc}\\|/// @page\\|// --SECTION--\\|/// @\\}"
// End:
