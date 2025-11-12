if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "C:/Users/beams/.gradle/caches/transforms-4/16be6066d5348a5466b6a33a0a094082/transformed/jetified-hermes-android-0.74.5-debug/prefab/modules/libhermes/libs/android.arm64-v8a/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/beams/.gradle/caches/transforms-4/16be6066d5348a5466b6a33a0a094082/transformed/jetified-hermes-android-0.74.5-debug/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

