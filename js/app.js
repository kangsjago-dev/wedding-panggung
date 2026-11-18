
    /* ==========================================================================
       MULTI-DEVICE SYNC & CATEGORY SYNC UTILITIES (v3.3.0)
       ========================================================================== */
    function handleAllPhotosLabelChange(newVal) {
      const val = String(newVal || "").trim() || "Semua Foto";
      state.allPhotosLabel = val;
      state.activeConfig.ALL_PHOTOS_LABEL = val;
      const inp = document.getElementById("cfgMainGalleryLabel");
      if (inp && inp.value !== newVal) inp.value = newVal;
      try {
        localStorage.setItem("WEDDING_ALL_PHOTOS_LABEL", val);
        const cacheKey = state.currentEventId ? ("WEDDING_EVENT_CFG_" + state.currentEventId) : "WEDDING_ACTIVE_EVENT_CFG";
        localStorage.setItem(cacheKey, JSON.stringify(state.activeConfig));
      } catch (e) {}
      // Prefetch & update badge foto untuk setiap kategori yang disinkronkan
      customCategoriesList.forEach(function(cat) {
        const catName = String((cat && cat.name) || cat || "").trim();
        const catUrl = String((cat && cat.url) || "").trim();
        if (catName && catUrl) {
          prefetchCategoryPhotos(catName, catUrl);
        }
      });

      renderCategoryTabs();
      applyCategoryFilter(state.activeCategory);
    }

    function syncSingleCategory(categoryName) {
      if (!categoryName) return;
      showToast("🔄 Menyinkronkan kategori " + categoryName + "...");
      
      // Hapus cache foto kategori agar dimuat ulang
      if (state.categoryPhotosMap) {
        delete state.categoryPhotosMap[categoryName];
      }

      let targetUrl = "";
      if (Array.isArray(state.customCategories)) {
        const match = state.customCategories.find(function(c) {
          return String((c && c.name) || c || "").trim().toLowerCase() === categoryName.toLowerCase();
        });
        if (match && match.url) targetUrl = String(match.url).trim();
      }

      const mainLabel = state.allPhotosLabel || "Semua Foto";
      if (categoryName === mainLabel || categoryName === "Semua Foto") {
        fetchGalleryData(true, false);
        return;
      }

      if (categoryName.toLowerCase().includes("photobooth") || (targetUrl && (targetUrl.includes("fotoshare.co") || targetUrl.includes("kingphotobooth.co") || targetUrl.includes("kingphoto") || targetUrl.includes("photos.google.com")))) {
        if (targetUrl && (targetUrl.includes("kingphotobooth.co") || targetUrl.includes("kingphoto"))) {
          fetchKingPhotoboothPhotos(categoryName, targetUrl, function(photos) {
            updateCategoryPillCount(categoryName, photos.length);
            if (state.activeCategory === categoryName) {
              state.filteredPhotos = photos;
              renderPhotoGrid(targetUrl, categoryName);
            }
            showToast("✓ Kategori " + categoryName + " berhasil disinkronkan (" + photos.length + " media)!");
          });
          return;
        } else if (targetUrl && targetUrl.includes("photos.google.com")) {
          fetchGooglePhotos(categoryName, targetUrl, function(photos) {
            updateCategoryPillCount(categoryName, photos.length);
            if (state.activeCategory === categoryName) {
              state.filteredPhotos = photos;
              renderPhotoGrid(targetUrl, categoryName);
            }
            showToast("✓ Kategori " + categoryName + " berhasil disinkronkan (" + photos.length + " foto)!");
          });
          return;
        } else {
          fetchFotosharePhotos(categoryName, targetUrl || "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs", function(photos) {
            updateCategoryPillCount(categoryName, photos.length);
            if (state.activeCategory === categoryName) {
              state.filteredPhotos = photos;
              renderPhotoGrid(targetUrl, categoryName);
            }
            showToast("✓ Kategori " + categoryName + " berhasil disinkronkan (" + photos.length + " foto)!");
          });
          return;
        }
      }

      const driveFolderId = extractDriveFolderId(targetUrl);
      if (driveFolderId) {
        fetchDriveCategoryPhotos(categoryName, driveFolderId, function(photos) {
          updateCategoryPillCount(categoryName, photos.length);
          if (state.activeCategory === categoryName) {
            state.filteredPhotos = photos;
            renderPhotoGrid(targetUrl, categoryName);
          }
          showToast("✓ Kategori " + categoryName + " berhasil disinkronkan!");
        });
        return;
      }

      // Kategori lokal
      let matched = state.allPhotos.filter(function(p) {
        if (p.category && p.category.toLowerCase() === categoryName.toLowerCase()) return true;
        if (p.name && p.name.toLowerCase().includes(categoryName.toLowerCase())) return true;
        if (p.rawName && p.rawName.toLowerCase().includes(categoryName.toLowerCase())) return true;
        return false;
      });
      updateCategoryPillCount(categoryName, matched.length);
      if (state.activeCategory === categoryName) {
        state.filteredPhotos = matched;
        renderPhotoGrid(targetUrl, categoryName);
      }
      showToast("✓ Kategori " + categoryName + " disinkronkan!");
    }

    function syncActiveCategory() {
      syncSingleCategory(state.activeCategory || "Semua Foto");
    }

    function copyDeviceSyncLink() {
      try {
        const currentCats = getCategoriesFromAdminInputs();
        const payloadStr = encodeURIComponent(JSON.stringify(currentCats));
        const syncUrl = window.location.origin + window.location.pathname + "?sync_cats=" + payloadStr;
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(syncUrl).then(function() {
            showToast("📋 Tautan sinkronisasi berhasil disalin! Buka tautan ini di HP / device lain.");
          });
        } else {
          prompt("Salin tautan sinkronisasi ini untuk dibuka di HP / device lain:", syncUrl);
        }
      } catch (err) {
        showToast("⚠️ Gagal membuat tautan: " + err.message);
      }
    }

    const GOOGLE_PHOTOS_INITIAL_CACHE = ["https://lh3.googleusercontent.com/pw/AP1GczPHZ3QY9eMPsK8b_7DtCq_9z0wS_QJshL8xKOXUVGTYGMIeN8gd1ym4s_pn_DsubWVtctp4frUYvaIMzznFjEjBBvXuf9ILeD9oM9ta3RZW1LgO64fB","https://lh3.googleusercontent.com/pw/AP1GczM2ftQDzzWi2J_4UTw5DNmCWYADu38Xl09dW9K5uMfFsOP6-yzZMn9Rzk3_lTUJyRi6RgX2OCM_mQLftQTvusmFrQ_Wih53S2sJ1XujKzrxn5b6_vMb","https://lh3.googleusercontent.com/pw/AP1GczNwnpnKY7WRkCY2srfkce_1Q2daHvjYfBxiF8gnszPTg8ybR2NvWsetSmP3bI_FU7s7x-fNu39MNjDwWWRBBpEUUnPjpw-JojoCwumccIp383zGZwMz","https://lh3.googleusercontent.com/pw/AP1GczMx0o71NbpIZLCzwtnhbXe8NNuo3BT43ud3pK4nIqePMCLzRMH1pD4cZ8sBy59Hy0w1S9_j4ISY99RDWbPY2NRaU4d7BTZNIso7GkzWYwBhMfc8LTGH","https://lh3.googleusercontent.com/pw/AP1GczP0O3ji5Szhcl5K5eyMWC8MET374SKiW2ymsxbSeZCtCzemRUfuU_EAKp7Xuv4ZhX_W1LBJbwlApScKKaAH2KYKeH6fGeplPv3X_SwbHbXEHv0xZ7ED","https://lh3.googleusercontent.com/pw/AP1GczMI4qPNMtsu6ag4vTsHi46y2D5qnLcwsOfNA9GOQ730ed2YqF_b2qxAcB6O32x0jUH6fjEYCTsDQeAk0_Lw3LM1zIWsIuAq3cqW_UPza7CNvh6ToFuS","https://lh3.googleusercontent.com/pw/AP1GczNNSAAghtERpfLvNtnR8iZ9HnGUy_oHIJsp04vVW_PbPDCRGKWkMP5QzK6eLpiS-iiRhw3x-VIDGmqeXPnZTnI0L02ZvpgT5yCWSH4C3RkAcxYKSpAJ","https://lh3.googleusercontent.com/pw/AP1GczNyDlvoWQ5vK8CBIbYezhfJhSFoT-rTMbf-Q3QhxnS1TeJIpoIAuyLNiVPIGmyUss_PV5kS-PWMEOXIzwk-3hRX5A_0v8nFn7ugoGYKJTlvjK2T2lhU","https://lh3.googleusercontent.com/pw/AP1GczMeCGP0e6xPqV_Ol45drEMJ_W05ZV4p3kWq5D5bhCa8ZMgK9-ObKagJT2bvT5EXG90ZlG99TkK76eJRB8c1pDUwPrFceRe8P3iILrQwxBnkUrdWgln4","https://lh3.googleusercontent.com/pw/AP1GczNPnmWhW6zQtCxJNmRa5DQEk1Hm8FiBXZsB9Glox-cV7Od98FX07e95aQpbDtBNd8u_ET7sKf4ORS9JZcoVGqdZ5GqvHUTjvja6N3yXjgjmgJ-9G5ze","https://lh3.googleusercontent.com/pw/AP1GczMvqTnx6bv_d0_tvregsed567rW4IqS5nwWOk8b8OqvOuGnH2m5QgILs4Z6mibkAW01MzLZL_zlAzzgC0xbZhK3Eb2HHUG5iclO4ePGVEMN9NmFuN8W","https://lh3.googleusercontent.com/pw/AP1GczMSJvbIqeavdnO9BWneL_DwLocwcHXdSJu0671V1XejbiJF4Wg26U8iI1WPDw3PSRD3FyjxwAj9i387FVzF2cHnOmXpdxWZ2jM9bmwRWGEmIrNffFPF","https://lh3.googleusercontent.com/pw/AP1GczPvgbO9k0OaKTunepKtsSdC8Iw-HSt5ZppXq1cY7a63C15xfXg-AfcOwhMjs7KLoEIICLJEzxDMDpk-7uxOWmFoF9RL6ZrQ_n3aN-SDcbpycT0U0YYD","https://lh3.googleusercontent.com/pw/AP1GczNaRX0WzkDs7d8Nw9PghiXNPZAMg3m2KGAgzTKFBJaolBbgkj16Jix1JyfnIXUDZzhGFYtZBaQRv7WQvI6HmVexY9IKsSS5dSKDIMIXSYRzHpLdTCZe","https://lh3.googleusercontent.com/pw/AP1GczOFhMCz5b9g6veYOXKLbc6-H4xeUdkIB6P98_x8sHac75TJzmrTY728VYT8iyOXU1meO_Pbl4AF4_mUjAg3sbslRsotsduUsaK29c_l-ElJGT58HrnZ","https://lh3.googleusercontent.com/pw/AP1GczPfBqcgrwOppJRz1I9hw0bX-6QIqwmeuz8bcrEp85wJcGZi2p_XniIEjYXzP-ji4e1Mgba_lsBwAYYGRqLILlUfGHZhhhhOQJdxcUWFEVoWS2QdNPcm","https://lh3.googleusercontent.com/pw/AP1GczO2lnRS6p7q9MW29EyY_xVOmgWRMfwGcSPRra3Y10Kpej8D8ealBRwvaD-VcDUwYAGOEa5w3YvuzlZb2d6ZrAXqygcpjFDWGIntQ914TzuLr72woYHK","https://lh3.googleusercontent.com/pw/AP1GczOfK-_h5CQBbe6cQ-Er6ryZ5ur_jKlkHQeHzQlrnMUmb10hxOFpsUVuSNTPh8U5PsUHwL7zRF0mruU95r_RE0Ly6BXOPRi2Qliquc54FYcIBp_-RPa8","https://lh3.googleusercontent.com/pw/AP1GczNtm3BFpROVQsNm6ISQUdpaPIxGETlqH1jmRn6IOLYy2H4ZNA4zw5vOS6OewWAHhkfOum4SsOqduOgbjkMMLW5etlzDOXaeMFMe2JtWuYuGhegiDD-S","https://lh3.googleusercontent.com/pw/AP1GczPFGQNB3G2gnV8zfjRL578MwnO1KdRR9W67l0sUGEHp2NSNzGCDzra5bGHBdFGc3XLV-sd1BnFIr4dp6inlwD1qgAvENTdI1WD68eNQqGhj97ZrwGdj","https://lh3.googleusercontent.com/pw/AP1GczOH-fdvA1LmIq0yuRH0IB1oKQHFH-n-kk_Fx9SGa_m5v14qvx3VbQNaumYPqM069QLZYM31vwPR0bcegEzPYK9Q48yhl1EjRF9FNpuxIXk1xs_PMKZ6","https://lh3.googleusercontent.com/pw/AP1GczMj0QKsZWCni3OJwCqEhCQLFmdJf1CqNnfCr83ULsu9CQaRIE-VUBJqJx3ZXyUnvmB9ybSqHVUTQymJPyjqSo_LFXRTUSeEYjJZfroU_pDeR6HMg9PU","https://lh3.googleusercontent.com/pw/AP1GczNz4PgwE_fziIETA0rje3REolY3VHltdYGBqkTDzidroADrdw1DhQovtSauwrq_jjLy9fESt_Pb320D_zKSN-f3uDE5k7Mtxzeq-TR5A_qMBtwWbrLn","https://lh3.googleusercontent.com/pw/AP1GczMXBDcNtGYZkXLyS7PsaY_HWqkw8o5ISkOgjWBmuX3LYHbkl_fi59fZU1lcqtcwKYyB-3JytrZ4qIHx7vik_1DFOdiDaGB502VD67WiqdwnknPvCMWs","https://lh3.googleusercontent.com/pw/AP1GczN_LjIbS2iYQMwNgifH8UMjguNBxnsAKsJH8iiOk5PQaplgOs7WKaY5S7m-fIzgmsVNHK2gX77I1KAbYAOJAH6iWVxm0tX5501X-gyrLxER_K4VA7mk","https://lh3.googleusercontent.com/pw/AP1GczPLg3So6x7FCud3NjQ4-q51ERUi5py31wX1Eveg5X4vzEJ8J7dgZZrFKJsp0emlwnJ7Qalx27rz37XjVa_d2LeSV0QQUKHsIaJPnNHbiOGpTYtuBBT8","https://lh3.googleusercontent.com/pw/AP1GczNawo2rKnhAw6ndHRlXrvmyuxH57iEVoX123KK6q_0lTy0fvwAVxnFwKroxGdQwNP0OwBN7w-BwKm9npe71lFQVqmG5NZJPiDTkGeRdEuKyj80W5mEc","https://lh3.googleusercontent.com/pw/AP1GczPpXd4u9uBVgYP8MOX_2skKr89VX-tCX13ezRB1jaSFXmCI39COGGzJiwJWu04ZmQ8NE7KOhofZ0VsfR4kfSKabWMvu9eqlmwzXzCPnY5IaBfgaZnNn","https://lh3.googleusercontent.com/pw/AP1GczPVP_b46VMZdb3oU1bA02tiXhPa2GuZQr9DbgIWyRyQ0jFQafSlM7vML9NNA_eeFYX9z9bfNMLTnxBNHPraZisienEBZERfOwYCMRGDzXmfkO5V9qPQ","https://lh3.googleusercontent.com/pw/AP1GczPVC49VP9vEeIyWX60gIJnRF0ev8-OCq7LyiNt-ugDAeoXfj8b05cqOt3ZmjUrvy53tMlQ1TdSo-ASoiffj1-14ojZBCD4WDjLzA46I7griH3K60Hvr","https://lh3.googleusercontent.com/pw/AP1GczMhdPqMMWwajD7ATdg5GvsiWqf4DbeNUXOT6qo9lNEXxtnhyLlTumOVBEi6ro_lanGxwr-udLu-MoqVhDjsHyNkItSgSVWyWh9013XHeutyLMcvigRQ","https://lh3.googleusercontent.com/pw/AP1GczMrLQWbaZ_1G4oKJPKg6lwdYtzcD4vV3CSVuC77s0roaX3vVjlD0yT0HeAQxxGHkfnvkP-S7AE3AF8awTk6b_QrolGlp_wCNK0kHRwmZQhnXE7W3pql","https://lh3.googleusercontent.com/pw/AP1GczMeUhrlIWDae6t-mKn-bOHNdQt_zbFNLadiosJ6QcYyH8LeCYagPCZEOrZoCXsk19DvFMeUUN3qKpYj4-xpfmnRsFoV5bKBGMhPDRvHRazwb136z5fk","https://lh3.googleusercontent.com/pw/AP1GczOFfm2b4x3tCdhJ6-hccjIeczkwUueZ-D8Z7A7yo0rBLvSNdkTR_a85D71BQ2iLjKunnIVVsQdMmwUse0VPK2px4ulXWW6Fz5v5_41Jd9M42vRjJ_jW","https://lh3.googleusercontent.com/pw/AP1GczPLm0PJsuM0tlWBW0EcpDBrAQvYf5RUXlO-Pf50_Scqfv03_9o_X2RKuN9KDGuAL_qNxQ87D4lwsMDtCeWHxK_WRziUDHplCHahUAxMxgNR9UHGxreM","https://lh3.googleusercontent.com/pw/AP1GczP2UTW0ElDfC9Y0VvNqC92IL3ikPhJBSdCSjBKpMREcD0e9n5N2zBknnvNEutpocBoh9shH0wGcrDD1KI5IDcYs6C8Wfj6H-2ypJqIXocy7dZyXXZMR","https://lh3.googleusercontent.com/pw/AP1GczO-WiIUVs1NIEOjqgdtX_qs_7L5QS1nLfLJThif9rno_Su-UYiATWqQ-K0mJphgpSL2kC5pemQTA17mkABLiuPKD3sFxfAxc705R5xszj3Pkju-D_YH","https://lh3.googleusercontent.com/pw/AP1GczMK_w2guig4XBCzsJcuSYcKoznK7mIAj6ax2EAt_v9xvbL12lxbyiu5EXZzdWaoSrpboGYM42U4R2MAJMQ4S5LcpwLqFfY2XFy4cj0IOElrKBROEXv8","https://lh3.googleusercontent.com/pw/AP1GczP3z64zWAvekEKAUFCTLoZdn8dDy1GaCHMWaVuPD1PpVdzXZRwunLxz_CtsKQcDCGcdq_UhwflT_uGmmni-dCF3oeJXNplFKQ8DIxyPY9XmeUir-j_c","https://lh3.googleusercontent.com/pw/AP1GczN6o8p77lw7yEfSCIlUcRHwaEoZwxSm4YMoTbc81Uu1JWEQDYPLgNpW8FcdyDUIxduK8rc8yu8B9owpd4mrE9PKJmOMgYS5zZFgX24p2jeR_9neIUwM","https://lh3.googleusercontent.com/pw/AP1GczPRMcOej2KJZIY_6oh3p1ixRiZaOBOtwak07ebx3jM7pkVS84djm6IFjsC3lDSniO1CbbvOmFuRwHtCTNtc2syfcXy4LcqHfMLC4M6HWXkXz0f9K6cT","https://lh3.googleusercontent.com/pw/AP1GczOUZ0YIwLmH2Xj1JQNrEYPkovlHjzxhNJwJPFgb4hyHI4dOeYzYXYn9_BF1vO7HJh6_rbO1u4I5kvb5SOEzxp2KkyxRJw8pwKeKMwNZ9dUctlvCKWX9","https://lh3.googleusercontent.com/pw/AP1GczNuSg1rTo_hDqrugasCkJ40ZUWQKEfdpaTY0anpvWKw2XX0o5B2SBYzGwUhe-10GIOsq_Q91O9czNvOms93xO88nu1ztI4g9st_SjdEJkyZTWCNBepY","https://lh3.googleusercontent.com/pw/AP1GczMfqSEou8KHN4QIbE2GtnX9uSpX5oCoPMs6ng1A-bYxUQKh1tX5nHA_TfUPEq0B58_M5I0YmB9QgLKLaSMvUSE2CuE_c6RHSQPGr6oGXq5b0ok-kVO3","https://lh3.googleusercontent.com/pw/AP1GczP3hzrvaZFlyxoy_rksVEdKAb9VVYqd6U1AnnsYuyKFOJX-h2WGRMHY_eEfLUGv4T-kd-M0LZi2z71N4v_gN9RblUKjA1t-84KmBNxsE7GzDqQMjKQB","https://lh3.googleusercontent.com/pw/AP1GczOmLXa9ADI2XP3qJsGDjFRhMoTrzkfh6Eq87BunEhy_fDYz3uY0PaZ8xdyeeP1z34MNku-VQAZi6ow4bm6K8-8R5D4xtCxfOLDSxxui9HtLWeONqnuT","https://lh3.googleusercontent.com/pw/AP1GczMveOaEvYKQs5FoIjGiI84LutnRJWeJdnMdwdX45G5_Rwj0xEDfxZqEc3hbe29B7soOH8yD7mUrZYkQGN1I7NBSaibDnsgsMv-OfwvKWHl-gfdOj3FP","https://lh3.googleusercontent.com/pw/AP1GczO2sIGU7ZbOg-fnHUH1PBSUfLxMKlHVEV4YAYxnY2Bx46tcprimV8VWoflprtpKhKYgCwL38T3zlY_dx42mlPFFbrCR42hDcIoWirqvZnJsn75nn2un","https://lh3.googleusercontent.com/pw/AP1GczMQRxhVtA23rWrvgHzu_jyNd4JgXevx16G8vasse37CyLQBJWE6a88s4KI2c5Dq95gdzNgLuVBz2F_GCrsIWQDAFPSponaxTvIAnkcmVeHf5kb4gYwu","https://lh3.googleusercontent.com/pw/AP1GczMVJ5k5bI0nLgvUYlZkYhWqVl5zE5J_uNdk9MzGSBB2SZzp7pgCBpqiC73bqHXGGYwT7RBpkk-RwrLczBfeZH1Qwy7EIOdvvX2as2VPPSKBvCo2heq4","https://lh3.googleusercontent.com/pw/AP1GczNzDzr1WEPLNszHDatoirUkVSajPIhcyR-r90TsTekuNYTDM2aaJ8hz2jjt2MDGFF-vXaWEm22jew3_9ohyWeiCiHBWU1cCBko6ihtH17SSZUg9X5W5","https://lh3.googleusercontent.com/pw/AP1GczPVXHza58yjRCV2EQS7LPGIV8ytmgLsscD_g9MlffmRjCHrqkafEqRVGXxt3YAkHvcDdj-gVbiRuoAfnllQQaXmVBY8cD-4NQkfjxgmF2IqjgtHWn5d","https://lh3.googleusercontent.com/pw/AP1GczNu76Q8Pg3hVpBTKDo89wr96m9FilFOhVPR4PLC9IqisIJhDlN_yE9YqGdgTkObQFzu_iaucWaWc-lzo_nqZXhCPf7Qp79N-RTjhv6an80hfjw7qqjp","https://lh3.googleusercontent.com/pw/AP1GczNSfV3CypeK-f81YHRoubSjNw2OSCrtSmo0UO3HjdEficpCb5cGw9-_dnbYqqz7Qtp6phGeGTUr75NJjF2VZ0Ymzb4zexa0u_2AfNfR6DfOPgbq64W9","https://lh3.googleusercontent.com/pw/AP1GczP5VM0lioq9JQ8_q2btQ71nMEF3_iJZMyy1in51FKWqSwZxd2XheDzS1jFFVeyi_kh4r36qfBooSrPXG7qlctgb96NlmcQJmxxNVXQAtOd9qpAbcT-S","https://lh3.googleusercontent.com/pw/AP1GczO6ob1ha0pQQWwGpqgGWvaIKJSbM7PV_IrtlCQFblJQph8vKBVnuysHyPxZ9Z_AudLtEzbxUEKAwaWUaTxTF98mAouFi4rkr9aaRObOwEYSrhFUPpLK","https://lh3.googleusercontent.com/pw/AP1GczMrFay0FQNDvE3l-CR5W2PXoJDWD2X7v_JHFhPc-ZatP-e6ehigefJ6WXsgkenrgvM0nFZvf-9Z-X5bWZqFdtV7KFArCHVVr4hOsdIm9z5sB0vBu-4e","https://lh3.googleusercontent.com/pw/AP1GczO6kKWPIkxa3DH0yOYjrxBblpwYMXjNXkMThPPPWzNM1Qq1MOifoNAOuT0zYg6u_kTiOhfXsMPMKImZvNsWzi_zJ0nh0Mi1mMOcoLw7sVfm0se_3gRG","https://lh3.googleusercontent.com/pw/AP1GczOZ8D40akSmza7b2TJf7ZWgM49wwQjjFU4DPeBcUtkGa-EfeppFWAvRF-r9Tv2gZzgZfymcCdcyzS7eIw4SPJxTGGOkA6vOK6RZRKEMTSsy5s5PQsY1","https://lh3.googleusercontent.com/pw/AP1GczO_S927gQOzOw09hTF8Bck23Pl_yT50doODJ_5dcQIrOw3xlv2bX71o-itZlm-9e3Z5eloGbvZq0M-MRPIcrF0GTQe5bPpjbOk_44eGo67E1z1msWs5","https://lh3.googleusercontent.com/pw/AP1GczN1xgTz148eZRwfzwIY0IsEtF88XtVSpLDJgRdiL0Q42gWGYjNCaytzyeuEu_dIWK6HxwCzmhy_QGTMELVL75smD2Yutlc4UjEX8DqZdwUFBTGkmWfl","https://lh3.googleusercontent.com/pw/AP1GczNdGqw4eGgGQa0X9h1MLNu_QcJyBPp4PKRKNoGgUOc1GPcq-E2BomZzFrWCpnlLLgf3svk61sl4LlIUcM4VRvSs6j1DmzB-oQi-A5kMfF1TccKrbV4B","https://lh3.googleusercontent.com/pw/AP1GczM98s8ETRP-gQnwh29CIOCTIlveHZPr8VM8bqaccOo5R3lSTGtJGp7WDU1kJQDaYd7o11Lw1oOThrm4hVMK5vA7GO6ephtF-z-X_wO8hEBSDz8RIoVz","https://lh3.googleusercontent.com/pw/AP1GczMfZwOKFxZRsYlNm37OfbTTRGP66roHQMHSF7fLn6QPJZ6mqKlo6iBsfR6ROFJagIr-9LYUh6s00Xy_ESUNb2fpuomnNdGgDpAduUm7WYIygPV6ogXG","https://lh3.googleusercontent.com/pw/AP1GczOIUn8Y3b4lvpAyRF0ZlW0SOB0ii5p737gwm8Dpt9VwCDVD-geyTA969uYWF9k3PjnmLbhIalAJkkD39WknVAtocmBYDm-L1GubQMjyrARvC2RPYiHk","https://lh3.googleusercontent.com/pw/AP1GczPt1tGBhCn28fGVaCaD6h2mlseo9PY8S6KLxc2fX29HdIRltz075m6meqV4eXzT55hrfKBMIHQIZxZCwG-Ky6KILtXvDFTWubGaq_bL17oazUscfIl0","https://lh3.googleusercontent.com/pw/AP1GczOBTRLDR219pBBf5F76AxYNKyOWHmU5X92WUBdAQ7iQ-qJYCHE44V_PHxZtroD7Oec__khji9C-5HI73uoWuIUdFdq7hKFF9VtpVH9ixkV9c0Vi3rrN","https://lh3.googleusercontent.com/pw/AP1GczNXGMkcd4ROrYjGwmcOb36hyimqQV9fRaZcHD0ackrUT2rxXeJwZxxFVsCzDjHhrsH6ekytgrQ6a5uEADoLwXXo_SfRkA9agO3Y54oTu0-lVIfwrFF8","https://lh3.googleusercontent.com/pw/AP1GczO_N9dM9sKHN_78qbHnEPKVMgzaeCOWRIsvTDPfry5mpkVugaUApbr17idxU1qFxfMVAjPQaMF5d8QAQOIQCHzgkC9ZcrUrAVlwcNI2SNV9EPTH_Gsx","https://lh3.googleusercontent.com/pw/AP1GczN7QrxZFfWKq7-_kSyXXdvLsI9ZT-rvnLxNNsrcPsAhdQDHLt-z_WOHFk4MqMfma969MECam19dB8voHMSTb05Up2UNp0Y7p2J9DojuP5llrfYbxq1W","https://lh3.googleusercontent.com/pw/AP1GczOs0bAnkyOJSANhApfzvXyt0Cf17U3bgQYes7W4XRfn0bWCWyHrUT8D-irQvh73VkRoDTleGJp8rkZfFfMZodT5MWcY69HQHEVgL_8PrFtExOOrBMaG","https://lh3.googleusercontent.com/pw/AP1GczPSWTHwoaTLJuIRnHmwDxjm21asVvIJQsTTFqgxmwuLx8a170MjNi5oSSJjUH4B_0R_Hb4jqE85LrGKOn699q0LNoB0dBF5qKaUm8oF-25oaXvg7mpk","https://lh3.googleusercontent.com/pw/AP1GczO1N316koFsiPPa4EuCZ0tvTaGhPottNDrYDcr8dLn15OrWZeDbslZ5z6Oj7CZMMrGh9LHgknjkw2zJo06uH86xrNWJz10gPYty8mKh9aOSjcZkSwrh","https://lh3.googleusercontent.com/pw/AP1GczOLqMtwIvUeGgs2vnUq4-2ObFEcWSmFwXcBbiTk_4dGSeLAGFK_38myYUiCf42sSVhoai6FclNHDwoXBEkdlxqVJjhm_rFXtF_Our77jVvCvkmjfOR5","https://lh3.googleusercontent.com/pw/AP1GczOTgUXLGWNGppSnWcQJ7v28AoEb7ehODRlVGxPVvuQE8xggPs838ekhLk6nT8KquMjwy2ySL_vJh5vtxG99y69cZGggLK3CGostQXfRbfrzfxKrVF4y","https://lh3.googleusercontent.com/pw/AP1GczNo-XtQZTBo0etOG1PQGhNWuxJmZkG9nCOGHwqxBAqrq2vyI66x4yzHeZhupkesYhoaTbO7BzFXOXbviKuSHfCJzwSLIuZIQosBRi67aWVJUHbEFykx","https://lh3.googleusercontent.com/pw/AP1GczM3XWv_073uACy3T_Klmr2jKF16xEoqn8fmN-wDTjnvwZdrdNK-k2bZWq0Q0lNVohH3bvirjnyr6M2YJPR6X_BoQ3YHhy2w5RM3PtEcrEbyMfM4zIp3","https://lh3.googleusercontent.com/pw/AP1GczM2Wd630T9lPMtLwkQFpzOmtOvlVf44HU8fw6lkl9oX9biidQSRNmw7K0LExMqBNNSw5n1XreffBxjjVSXBGrG0la2TVkcHhbmd0s8mBnA9qOGl4RTj","https://lh3.googleusercontent.com/pw/AP1GczNwrkqS2F3jbMyUr7vPYSG0Ja53DdFGxxYFmLtAdeQUu2RZQIeHltnSl8llgFN2RreaR7IteEDmU3nfrNiesZraiVDCEOCWhsQJjJqW9cTlWR-_LiAz","https://lh3.googleusercontent.com/pw/AP1GczMpKuIRpVmjIipWHOU87bN6lEcylcOtsnnW94QvRzbQKsWSkq66SbJ5n5oAMcOP-vCwZY3wRc15xuwHbQbzTFW48O9iYaAx4IT0WQ4wlvMOctAVmBHC","https://lh3.googleusercontent.com/pw/AP1GczPWYTCHwaBWLXBJ2ZOUrgACckVjES1TjfMtoAgKyO28pqCZnqmxLCjDqrXYsR1l8pfJ5AqFvdpN62yCO0NXFv3whTr6trhTretuzTdYBFQZPbT8jDvo","https://lh3.googleusercontent.com/pw/AP1GczNWUHxeBa4wpdOrF6luwb1E5fl0P3Ev2LAHIYAHVljLP3nEp-84av6jtejyC2ebtwU4C845BbVNWfAHizxyOW8BGL9OViTZj4VahftTO7jli1_vT6Qx","https://lh3.googleusercontent.com/pw/AP1GczMLUidGUSd795t1F5hauC7cq-M0kWDKQF5C1c2Jzqszjzh6SyA0E9MKKvf4koYv5LF0BgRR-iF5zpg8ZuiNRcGxsS6yREpae0STjRT0pWzrgg7mgANK","https://lh3.googleusercontent.com/pw/AP1GczMRr3xDKUnWgxZGpW4KpO_7iDrNlhy2jRp2syjNtSfwTq7sw1tqOSn64idEwy3flmWau7lBtINm_6MlknE8IVt2X1hZnStwQ-3Yn6auu7rVf3irnzvF","https://lh3.googleusercontent.com/pw/AP1GczM-4UfR_8b7NciNgijfbvGLEXHH0X7uZHDH5bmWJSmwuTegGPivBZYPlNkVn6vysv9MTLDzCnF8pNxK3wjaGSsR5RRX-inNuQivVFNSYsjWuHzY5LAS","https://lh3.googleusercontent.com/pw/AP1GczOQgeHGF9FAMoEbrQLkV5I-FMHaCtB0mmNU0uqTfRZ2julrlBl-EM2bdqsDu1s8gEKxap3503r8EJ7TRP3NYlyCv-8_wSrwT17cT5h1IXLNDY-0FsS4","https://lh3.googleusercontent.com/pw/AP1GczNMpUIOae9xHN03aPNWOnr3cj6MbLSC1nqTrQ9o7ZtOHqUttI5zilIOu07rih-rCvDfOtftvRpwhgCIIi9GvUsBnIBRnSbUhU7yemq1DnyJImnfMFGC","https://lh3.googleusercontent.com/pw/AP1GczOjWXPd4KRCf1iCEuIcDKj0l269v4tRSJ2qtxk4pzEHJ26GP0-PUDjKRkTDNLNbnbm9tfHewC_9CZJX6wy2-w-6Ocmgo9QY95nr80Cjigytx2xEc74Z","https://lh3.googleusercontent.com/pw/AP1GczO__xQHyLIlZ9hsRBOALRReukhhZNdQkGy0f8HSEzL5NHgqXfMSzAtneJ34YZchkk6Aefx0LDzxboXvl7WJ-HeldPkkLd092xv-v33NLxF7s4pH1Zt8","https://lh3.googleusercontent.com/pw/AP1GczMIz2t0i7Nwt7w7QWeHhfXlDYQeUcjEWwofmW8KYoeij1Mtvu230Au-I-KlHxFh1yGGJx_S5vJ9OgqOi1tcbS-QShsogEQDdDF5wVSAaPjRLa8ze2K1","https://lh3.googleusercontent.com/pw/AP1GczNZJXZNRqO7kXly4sSC-NkHfu2Eexte9OIDlhLv2ACbvLxAm-aVjC_1h0m3MLFsH_oF4KHjGVMjuT3aXA3dfoxGlFqw_c9s-ViiG_QQSJY_9jMY0q5D","https://lh3.googleusercontent.com/pw/AP1GczOqtLkUphUqrDFPwu6gL9tzwYfMvIutFLjeH5z9-xUO4WxAaV8rc003I2214c8cDt8XMjy8J8M6guO2v3YN74r4BYBzYdwBlkI2zsXx1GvO6m4SGQNO","https://lh3.googleusercontent.com/pw/AP1GczMD2Me0xYOMgVihSivrEm6Gf7ySx4tmiGLrCyWYOuffgol3LDwHmLGg6slHWW0FlPk0eTeZkQJJLdqrY3QfAWNVHI_V_ZnD9-G_W08s_AeBMmA7P_tw","https://lh3.googleusercontent.com/pw/AP1GczM78UNV6FFRMViwrMdhblEvMHCuzLCBAGZKWhaQZVrUpJgFn-5oNfTqGzkalMf3vDtYI0YmBUJUh4KC87ytZjIjIupjJ65fIXUYz3fmfGJBSMzzsBbD","https://lh3.googleusercontent.com/pw/AP1GczNFmhuAtxzdo2upxbxYnV1reYB_qs3onfc7b-SFMmODVC2KYvIa0zVsz1bhG7mZhe533vUA0bF6DwsZF6POtHadcUeHQUEEo3FE9Xcwct_GwBsXDXth","https://lh3.googleusercontent.com/pw/AP1GczPEIMzjvUMHhXjNxJIjmIzL1HSbuTfDKFc--zKH8lBfC-fH7vTwpELVWXclXZ2zqgxJ3BaoDY4A__bbSuJa9IfU8vea5xQuDavhYykSy5et5xKcoAxa","https://lh3.googleusercontent.com/pw/AP1GczOiJdMiFD5Eg_LmQDVi_9_SZ4wY0OaOgps6JTcXdtG8ygFojCBPYgcpsnuX22Wrh9y7-lDYDpahago3F4EWFqggSAOiX26utyQICBEpDMHMAvo0lYnk","https://lh3.googleusercontent.com/pw/AP1GczNuSiLsf2ROhbXPPzI--7Ax4sS88Mezt8b-BV3QopLW2pmVapowkIRoO2iuBTmWIwd8sf-O13DU9buZEUijcpR3hAgXiEChvNWOOjU1Z-DNC0FbkCah","https://lh3.googleusercontent.com/pw/AP1GczNjLHypxAeb7QDqeQH-sCIYfdThQ3H7zS44kvhKmq0jsCDPkYZKeXLwNDaVwU2Axv07qHzFj5q_MZkpw6POST8O2L8eOgzwZptvMYDI33bwjR7fnnRa","https://lh3.googleusercontent.com/pw/AP1GczN8-3O1H-AWKTRD2IoSnf_WL3WnY_3Wpjp13Bk2trstw3V-_eVrrEe_ITnn1c2n5UzIlJWRrNnzTPbRLgJhoReCYBg_qygLEwYqQ-7O8J2SZkyXIlRb","https://lh3.googleusercontent.com/pw/AP1GczM_6UKnUfDev1OOyazoDVAysTT2nS48PHg-t54Nk6eHogpjUXVuiXJi198qAH20tGJiroOen57KjC8l0jrpbAnKhAJmUO6NryqtZixPfPYRAxnGloCo","https://lh3.googleusercontent.com/pw/AP1GczP_Fil_J4G_mYbYCflUxhaDxa6abb83AbXaY4NFflqCsy8JMSFusNgs21iwcAGGuCcfXw2w4Mx4ZIsH-PF-lxT7F6XwtBPfMCSX6fuwzlyHsFfQ7aIq","https://lh3.googleusercontent.com/pw/AP1GczNHxmgjGo9DBw09Qro9qfhZ6wSscEOYGIxD8ZmE4Zvn98iuZckNapG_Fu97yv2Q36cIiuPetMw7nGbu7DjK2BTCFxjDP7k4tjZFw7bdSUbqb3YM3yAn","https://lh3.googleusercontent.com/pw/AP1GczPARUiqEiEeicAbVNzGcgmcSAD1ZWX_q-QTm-E_IbNrzTU9qeVoqdb5Ajb8wcDPIjPIobNWXUqVpAefCbhz1x3x49wbAq4AFvJPVWa4XVwF5aHgGqks","https://lh3.googleusercontent.com/pw/AP1GczPLMYISa_9qCrt3_DnnWCKQjjffLy3tf63q93pTIpz1mZ4iRP_PpSdzJv4w8DrtzdsNVO25B1dVj5Vzz5CIz8jmmPq7_-SLs9O1i1A0MDXsryVLHH_h","https://lh3.googleusercontent.com/pw/AP1GczNbIFISoXQPLHXtFscr4EokUWMJE1El8hFLqzKjEeplzpclO1AlxTJn4E4pNVubeQ-nPhHXfAgpGoGj3XcYZgajhYoKty6IIdesBbjOQh5idULtXSHI","https://lh3.googleusercontent.com/pw/AP1GczN1ewhehiAWWrGTaRK00sGAmtpaHOBbX1QLeyai9ASsDaZNcX-hVc0GneJbrYmjR3c1W6p1Ba0R1j5nMW7qVOinxsotlgYayMK0Yidx3ugYVX6Z6cvz","https://lh3.googleusercontent.com/pw/AP1GczNcTaq47UPl43i2vmAtluwCcniOrXU2NFHBfI8Yw_1VxoHdpSfLbAm1_rdJ0ZF7WPM-KgU4JsxaehrR6W-UzGr_p1RwXIRcboqsUqg1EY-EmeBo49ps","https://lh3.googleusercontent.com/pw/AP1GczOPtkSRresSPa3Mi6GcTouVu71mCaw9QI3Bksk8w7imHgR5qnfCFLI-Ijhc3SewZRqjxN9WusHJDfx03Kz7H0J3PZlUQG7QDAliaVfxfCspqLypG4Gt","https://lh3.googleusercontent.com/pw/AP1GczMJdGCrP73xAgzkNBCKIdXlkXsE_Bw031OO4vPKObygkxiwnQtocCUNKRcwxa6WIHsYXc8zbHhklvazfiLGa4dDdTE7OGjrwus6NUy5zARXeu3nz-MX","https://lh3.googleusercontent.com/pw/AP1GczNQpn1HG00AJXBQe6_X8DE0tGjimCrtze9Wk7r3c9rS57XY47M2d1h06dD_m3zguBE9AY8D3uuRFXk9pnsfiZCka0I1TxN9J7eiceZTdBLrbHgjdli8","https://lh3.googleusercontent.com/pw/AP1GczP_2e2rDOv9WHwSusGPDCVrKgOkaAbgRxc8pvq3-ze0kFTyefaY8shS_ghb9qtkuJ95aPoOWodkzxBv8Xq6PLxlYsimsWMUyi-wy4FLpkfLk8oHS6DQ","https://lh3.googleusercontent.com/pw/AP1GczP3s6wUvzsfA7FBLUdi_aJJ-e1n3BdhuXZkNqaFAPTBiD8Jpq-fJqeGWzusH0q1wqwygABxomUYG00Jm7toZBwgWvI5txbL4pAUvEX10FolOxiL_6TC","https://lh3.googleusercontent.com/pw/AP1GczNtM8WxH2o4zrABRvkTN24zd5ytPgLHpJB6a8hHy1P6ZiH9MPCYdbQa0IOD6mmsV1uZU2MqGbXQCJo0T5AmoXgT6UP9t8_ClgKBvp8pItxGyET_gYFS","https://lh3.googleusercontent.com/pw/AP1GczNs41Ptzq0ybs3oL-wYtQhZKmN9JayGmsFK51vSWuZ_uS3EBkgZzDzYWva3FRCz6i6c2CYHg-vuG8-CiC4YKPy-uMlG_Lmj8peZ5mhBKVhqPQZa26ob"];
    const KING_PHOTOBOOTH_INITIAL_CACHE = [{"id":12696,"share_token":"12a27631","thumb":"/storage/thumbs/78/bb398735c01a58a281d8903d.jpg","is_video":true},{"id":12695,"share_token":"7eb638b5","thumb":"/storage/thumbs/78/cb02ef5429c7228e382cad42.jpg","is_video":false},{"id":12694,"share_token":"7cf9ba98","thumb":"/storage/thumbs/78/8f1aba45f919adb99c81dfb0.jpg","is_video":true},{"id":12693,"share_token":"0ad4e352","thumb":"/storage/thumbs/78/c051abd0c32edd80787bc207.jpg","is_video":false},{"id":12692,"share_token":"d4f05ff0","thumb":"/storage/thumbs/78/fd93d559347375eb20be8918.jpg","is_video":true},{"id":12691,"share_token":"e88218ac","thumb":"/storage/thumbs/78/62fe0cc2939769c8dfc4a270.jpg","is_video":false},{"id":12690,"share_token":"f5a23a76","thumb":"/storage/thumbs/78/e4e67f00a8dcea98431e3d90.jpg","is_video":true},{"id":12689,"share_token":"255e3361","thumb":"/storage/thumbs/78/41a06d1c44612d41f9e4b39f.jpg","is_video":false},{"id":12688,"share_token":"fff19549","thumb":"/storage/thumbs/78/406aa303f3baabf691212cf7.jpg","is_video":true},{"id":12687,"share_token":"cc2d9781","thumb":"/storage/thumbs/78/bb4ea665ec43cb737e7b52ad.jpg","is_video":false},{"id":12686,"share_token":"7ca3e640","thumb":"/storage/thumbs/78/823b80230acff33e04b98b24.jpg","is_video":true},{"id":12685,"share_token":"be7553b8","thumb":"/storage/thumbs/78/32af5fe97ade8756e419e953.jpg","is_video":false},{"id":12684,"share_token":"e6f81819","thumb":"/storage/thumbs/78/5be06f774b9b660bc91c4288.jpg","is_video":true},{"id":12683,"share_token":"91531c08","thumb":"/storage/thumbs/78/7079984e0efabc026e23b5f6.jpg","is_video":false},{"id":12682,"share_token":"7b204f03","thumb":"/storage/thumbs/78/d74af98ee26063979a67f8f2.jpg","is_video":true},{"id":12681,"share_token":"aced8ce4","thumb":"/storage/thumbs/78/2086e7f98f1a26d0741f3178.jpg","is_video":false},{"id":12680,"share_token":"9b22369e","thumb":"/storage/thumbs/78/d01abc9392677fb41bf7a5c5.jpg","is_video":true},{"id":12679,"share_token":"ecbdb63b","thumb":"/storage/thumbs/78/98a6262e4f92153c9ecf4dbd.jpg","is_video":false},{"id":12678,"share_token":"9ee441fe","thumb":"/storage/thumbs/78/ec4430132f86d98463bb931a.jpg","is_video":true},{"id":12677,"share_token":"debccc42","thumb":"/storage/thumbs/78/079e540ae84efce0dbe531fb.jpg","is_video":false},{"id":12676,"share_token":"19e2ce18","thumb":"/storage/thumbs/78/7d81b411c9eedf255b3f83f5.jpg","is_video":true},{"id":12675,"share_token":"6e052412","thumb":"/storage/thumbs/78/7d36042d9b599e00a65186b8.jpg","is_video":false},{"id":12674,"share_token":"4d5ed71f","thumb":"/storage/thumbs/78/bb4eac6ff55fd075f1cf629e.jpg","is_video":true},{"id":12673,"share_token":"84b4c32b","thumb":"/storage/thumbs/78/607e59ef6c71dbf799481835.jpg","is_video":false},{"id":12672,"share_token":"069affe6","thumb":"/storage/thumbs/78/9f64bd119b3bf0610e2744a9.jpg","is_video":true},{"id":12671,"share_token":"12ab8488","thumb":"/storage/thumbs/78/bc80778674d9f477bc8e4c81.jpg","is_video":false},{"id":12670,"share_token":"91c68538","thumb":"/storage/thumbs/78/9d147c6b71880d59782200fd.jpg","is_video":true},{"id":12669,"share_token":"2bee509f","thumb":"/storage/thumbs/78/215bee56f8123aec619df162.jpg","is_video":false},{"id":12668,"share_token":"1fc13563","thumb":"/storage/thumbs/78/6f7b530f2f3fac1b82c14e00.jpg","is_video":true},{"id":12667,"share_token":"7aa61ccf","thumb":"/storage/thumbs/78/f392eccf75cb490d951897ed.jpg","is_video":false},{"id":12666,"share_token":"325570ab","thumb":"/storage/thumbs/78/0d20cfb40ae8eb9ec6a9356f.jpg","is_video":true},{"id":12665,"share_token":"3d22b665","thumb":"/storage/thumbs/78/f25e9fdfef1874d973099b82.jpg","is_video":false},{"id":12664,"share_token":"821dd017","thumb":"/storage/thumbs/78/93d1b8f981cbff878d9ea99c.jpg","is_video":true},{"id":12663,"share_token":"470afdd5","thumb":"/storage/thumbs/78/dc2a8e22addf8cce321dae32.jpg","is_video":false},{"id":12662,"share_token":"2537716f","thumb":"/storage/thumbs/78/66b5f4219c9d4de54d2820cf.jpg","is_video":true},{"id":12661,"share_token":"78753f59","thumb":"/storage/thumbs/78/81ff4f36b6cb548e4de20860.jpg","is_video":false},{"id":12660,"share_token":"5e0fb203","thumb":"/storage/thumbs/78/2e6a2d1b25e6297dbfe77dc1.jpg","is_video":true},{"id":12659,"share_token":"de0e4ab5","thumb":"/storage/thumbs/78/19848bef1809a9f7a480b228.jpg","is_video":false},{"id":12658,"share_token":"93f7711f","thumb":"/storage/thumbs/78/926bffa10ff10ba5ed459677.jpg","is_video":true},{"id":12657,"share_token":"f73d76f5","thumb":"/storage/thumbs/78/b9c0a3d8e44f558ed660d29f.jpg","is_video":false},{"id":12656,"share_token":"1e648fc4","thumb":"/storage/thumbs/78/883ca5b85f61dc8fd040bb0c.jpg","is_video":true},{"id":12655,"share_token":"8e64ffdc","thumb":"/storage/thumbs/78/0df283ffc07bdf839d8ec809.jpg","is_video":false},{"id":12654,"share_token":"a90f7d4f","thumb":"/storage/thumbs/78/5fa702ccc82e3d7dc71c326d.jpg","is_video":true},{"id":12653,"share_token":"d9168833","thumb":"/storage/thumbs/78/80f070c9daefc8055cbe51f0.jpg","is_video":false},{"id":12652,"share_token":"7bd090eb","thumb":"/storage/thumbs/78/87716e830a142c8577e5c43c.jpg","is_video":true},{"id":12651,"share_token":"b61f523b","thumb":"/storage/thumbs/78/7df95aea4e616727d40d3213.jpg","is_video":false},{"id":12650,"share_token":"69f95040","thumb":"/storage/thumbs/78/6b0769ed8539d20fdee0452a.jpg","is_video":true},{"id":12649,"share_token":"4390a52c","thumb":"/storage/thumbs/78/00bfab97b62093234b83e320.jpg","is_video":false},{"id":12648,"share_token":"13606292","thumb":"/storage/thumbs/78/fca424b3d27528d6af2baa99.jpg","is_video":true},{"id":12647,"share_token":"7be83ae9","thumb":"/storage/thumbs/78/f99390d16741cbd0cb88ec46.jpg","is_video":false},{"id":12646,"share_token":"b1631170","thumb":"/storage/thumbs/78/84eeca918d5b9e938983285c.jpg","is_video":true},{"id":12645,"share_token":"6a72db24","thumb":"/storage/thumbs/78/ecfc94210b6fe7581af2cc64.jpg","is_video":false},{"id":12644,"share_token":"a81f870a","thumb":"/storage/thumbs/78/a6e596cc1e3a128cd3d5e25a.jpg","is_video":true},{"id":12643,"share_token":"54106953","thumb":"/storage/thumbs/78/6b7df4e07d06d0abad0a5166.jpg","is_video":false},{"id":12642,"share_token":"999db08f","thumb":"/storage/thumbs/78/6c3df8c8e3d6f809368e931c.jpg","is_video":true},{"id":12641,"share_token":"0b0123af","thumb":"/storage/thumbs/78/c86d78d8a12d0db953e2d6f0.jpg","is_video":false},{"id":12640,"share_token":"fbc76c91","thumb":"/storage/thumbs/78/dd54befbb0fc9027a99b047d.jpg","is_video":true},{"id":12639,"share_token":"4444b35f","thumb":"/storage/thumbs/78/f9a901c031bc93962bc5b3d0.jpg","is_video":false},{"id":12638,"share_token":"b611c070","thumb":"/storage/thumbs/78/df710654eb937b4bd51b1e6c.jpg","is_video":true},{"id":12637,"share_token":"f14f66c9","thumb":"/storage/thumbs/78/53b46695c89bb292d2e4b5cd.jpg","is_video":false},{"id":12636,"share_token":"104862da","thumb":"/storage/thumbs/78/6d6acc6f1dd005e97d1bdd02.jpg","is_video":true},{"id":12635,"share_token":"b0435d25","thumb":"/storage/thumbs/78/76af742d637127c62b164638.jpg","is_video":false},{"id":12634,"share_token":"dd37b19b","thumb":"/storage/thumbs/78/b9123db480926369ef40da3b.jpg","is_video":true},{"id":12633,"share_token":"e958df63","thumb":"/storage/thumbs/78/193e5279c130b11a75636a13.jpg","is_video":false},{"id":12632,"share_token":"29e3128a","thumb":"/storage/thumbs/78/1c1d6875eee47a869cde348c.jpg","is_video":true},{"id":12631,"share_token":"72ba35c9","thumb":"/storage/thumbs/78/b657e9df36ff3d8ad14f6cbf.jpg","is_video":false},{"id":12630,"share_token":"85acf994","thumb":"/storage/thumbs/78/fbf70d250d9841d1b8e0fb06.jpg","is_video":true},{"id":12629,"share_token":"18cd5526","thumb":"/storage/thumbs/78/ecb8b07d91ccd882baa95639.jpg","is_video":false},{"id":12628,"share_token":"d0391f12","thumb":"/storage/thumbs/78/383726afd07ee9d70e77c009.jpg","is_video":true},{"id":12627,"share_token":"1200dfb6","thumb":"/storage/thumbs/78/b738580d4949e0ff0b936461.jpg","is_video":false},{"id":12626,"share_token":"2faa97c9","thumb":"/storage/thumbs/78/735df9dd1a7cec41e5980cb4.jpg","is_video":true},{"id":12625,"share_token":"13f81346","thumb":"/storage/thumbs/78/9411ad5c7908468b0c03b4fd.jpg","is_video":false},{"id":12624,"share_token":"e9bd3e68","thumb":"/storage/thumbs/78/fe1af50f9471887859464f2b.jpg","is_video":true},{"id":12623,"share_token":"28ebca8c","thumb":"/storage/thumbs/78/7d8d1463ee154f410d9483ba.jpg","is_video":false},{"id":12622,"share_token":"d6718775","thumb":"/storage/thumbs/78/4726b24610880a1837b3c631.jpg","is_video":true},{"id":12621,"share_token":"c1eb9d11","thumb":"/storage/thumbs/78/036126e908feee2b8afb12d2.jpg","is_video":false},{"id":12620,"share_token":"59ce9efc","thumb":"/storage/thumbs/78/c40044016c877f8ebdeba776.jpg","is_video":true},{"id":12619,"share_token":"a79c5791","thumb":"/storage/thumbs/78/38b0752536e1d9038be52c1b.jpg","is_video":false},{"id":12618,"share_token":"69402f20","thumb":"/storage/thumbs/78/2d9e87f6ff03519c9e036301.jpg","is_video":true},{"id":12617,"share_token":"ca6473d6","thumb":"/storage/thumbs/78/a8a1a324c25b407eeb3e8e85.jpg","is_video":false},{"id":12616,"share_token":"eda6d5fe","thumb":"/storage/thumbs/78/bea9f2cf8711f570b2398649.jpg","is_video":true},{"id":12615,"share_token":"d25d4f52","thumb":"/storage/thumbs/78/850bc34065f94d80b33b55a6.jpg","is_video":false},{"id":12614,"share_token":"2b046d32","thumb":"/storage/thumbs/78/22df7530be5e830d13705260.jpg","is_video":true},{"id":12613,"share_token":"f8d8a936","thumb":"/storage/thumbs/78/01fec918eb652bd4901cb4f0.jpg","is_video":false},{"id":12612,"share_token":"d4cd51c2","thumb":"/storage/thumbs/78/082932e0f9c4d22d468d70ed.jpg","is_video":true},{"id":12611,"share_token":"34377cd6","thumb":"/storage/thumbs/78/b015a93cee384d3b1ea3cb15.jpg","is_video":false},{"id":12610,"share_token":"b717079b","thumb":"/storage/thumbs/78/25497bf06d3153638633d1cf.jpg","is_video":true},{"id":12609,"share_token":"9375b4ab","thumb":"/storage/thumbs/78/62ca2d1157daf9ea75dd8287.jpg","is_video":false},{"id":12608,"share_token":"05011c3c","thumb":"/storage/thumbs/78/1370473664c84b39ffbff03c.jpg","is_video":true},{"id":12607,"share_token":"02c3855e","thumb":"/storage/thumbs/78/37f6f285ac1bc8c90913e4aa.jpg","is_video":false},{"id":12606,"share_token":"f69ef284","thumb":"/storage/thumbs/78/bbaf7c4450e49334f97e4236.jpg","is_video":true},{"id":12605,"share_token":"fa9e7c40","thumb":"/storage/thumbs/78/da9d57115aa273f89cb49cd6.jpg","is_video":false},{"id":12604,"share_token":"46a14b25","thumb":"/storage/thumbs/78/8c721071598fdfa38850833e.jpg","is_video":true},{"id":12603,"share_token":"d1e20647","thumb":"/storage/thumbs/78/8aa555b1915ac00a7ed22c73.jpg","is_video":false},{"id":12602,"share_token":"de33e8cc","thumb":"/storage/thumbs/78/08a6c0918625fa92822da7d9.jpg","is_video":true},{"id":12601,"share_token":"8c8a81df","thumb":"/storage/thumbs/78/bfd15c1a528eb6303ee4c095.jpg","is_video":false},{"id":12600,"share_token":"57b17952","thumb":"/storage/thumbs/78/e31fb82652749ed44eb1925a.jpg","is_video":true},{"id":12599,"share_token":"c23daff4","thumb":"/storage/thumbs/78/f2590bd825fd1cb0ece5f657.jpg","is_video":false},{"id":12598,"share_token":"c9f21c6f","thumb":"/storage/thumbs/78/82e3575b6cb52b520e6552a8.jpg","is_video":true},{"id":12597,"share_token":"3dd0876a","thumb":"/storage/thumbs/78/142d7f7297a6658a8ca3ad26.jpg","is_video":false},{"id":12596,"share_token":"ef5513d0","thumb":"/storage/thumbs/78/27dd4925cec7e05000b5bd56.jpg","is_video":true},{"id":12595,"share_token":"378b71e1","thumb":"/storage/thumbs/78/a48368e0dc3146a1e39e6d4a.jpg","is_video":false},{"id":12594,"share_token":"956ba99a","thumb":"/storage/thumbs/78/84278c358850f22a8a4115f7.jpg","is_video":true},{"id":12593,"share_token":"6461a992","thumb":"/storage/thumbs/78/eb067c311d2d3855a4823226.jpg","is_video":false},{"id":12592,"share_token":"64126767","thumb":"/storage/thumbs/78/89a77075948d179d38ddda6e.jpg","is_video":true},{"id":12591,"share_token":"96645fe3","thumb":"/storage/thumbs/78/0f268d20e396b6bc41a6ca48.jpg","is_video":false},{"id":12590,"share_token":"d7beb077","thumb":"/storage/thumbs/78/4ad4ef4fa88a5bb7dec08964.jpg","is_video":true},{"id":12589,"share_token":"7cf3e880","thumb":"/storage/thumbs/78/54be8376ab4abc3d4d150044.jpg","is_video":false},{"id":12588,"share_token":"3913e970","thumb":"/storage/thumbs/78/3440787b0ed930f40103962a.jpg","is_video":true},{"id":12587,"share_token":"13524715","thumb":"/storage/thumbs/78/154e2620fd0d89fd96d82ac3.jpg","is_video":false},{"id":12586,"share_token":"9210ccb0","thumb":"/storage/thumbs/78/ece7b7a537f922f45cbd606e.jpg","is_video":true},{"id":12585,"share_token":"9d0402d4","thumb":"/storage/thumbs/78/28e0177cdba0f83ccc74cd92.jpg","is_video":false},{"id":12584,"share_token":"216fd771","thumb":"/storage/thumbs/78/328d2cefe0411c8c13e6730c.jpg","is_video":true},{"id":12583,"share_token":"689a2596","thumb":"/storage/thumbs/78/9aec7f141da05bc7393c8da0.jpg","is_video":false},{"id":12582,"share_token":"9e6dc322","thumb":"/storage/thumbs/78/0b8357b71db7ed0d280b3f1d.jpg","is_video":true},{"id":12581,"share_token":"dc014d04","thumb":"/storage/thumbs/78/8447f06178f4e8f6e3c5f5f8.jpg","is_video":false},{"id":12580,"share_token":"daeeaa9f","thumb":"/storage/thumbs/78/9ee5eb8c78beb4c1298df222.jpg","is_video":true},{"id":12579,"share_token":"da070186","thumb":"/storage/thumbs/78/c7cdda90ae0cf2562d9a60bc.jpg","is_video":false},{"id":12578,"share_token":"c9bccd0d","thumb":"/storage/thumbs/78/2a20ecfa1f9bb7b4de92c692.jpg","is_video":true},{"id":12577,"share_token":"8fb45e05","thumb":"/storage/thumbs/78/6c7c43821695b6d1a7018312.jpg","is_video":false},{"id":12576,"share_token":"0a753c9a","thumb":"/storage/thumbs/78/dc318fd99820b43943455f66.jpg","is_video":true},{"id":12575,"share_token":"708b1f03","thumb":"/storage/thumbs/78/70a13a93909f277f4757134e.jpg","is_video":false},{"id":12574,"share_token":"e7357805","thumb":"/storage/thumbs/78/5da19fc3d57d302f8fbdb231.jpg","is_video":true},{"id":12573,"share_token":"c2b4802c","thumb":"/storage/thumbs/78/a2fbb38afff20a07885824ce.jpg","is_video":false},{"id":12572,"share_token":"87f69939","thumb":"/storage/thumbs/78/84b9cb3935d01b5473e7994c.jpg","is_video":true},{"id":12571,"share_token":"8301846e","thumb":"/storage/thumbs/78/a9d5103a829bb5739e3cb881.jpg","is_video":false},{"id":12570,"share_token":"7649ad78","thumb":"/storage/thumbs/78/f85319f1be7496d8a50d7c22.jpg","is_video":true},{"id":12569,"share_token":"b35028dc","thumb":"/storage/thumbs/78/6b8e1e1b7b4122f9588d1a40.jpg","is_video":false},{"id":12568,"share_token":"d2cdd8d3","thumb":"/storage/thumbs/78/2639f1e6e98899c3b1dc1e4d.jpg","is_video":true},{"id":12567,"share_token":"9fa6e033","thumb":"/storage/thumbs/78/f19451b9f0863f95234f9a29.jpg","is_video":false},{"id":12566,"share_token":"4466f015","thumb":"/storage/thumbs/78/28b9e3f6cfc14236ef612797.jpg","is_video":true},{"id":12565,"share_token":"ee27b5fc","thumb":"/storage/thumbs/78/ee1fbc82e162ac92be39a08a.jpg","is_video":false},{"id":12564,"share_token":"efd77ea7","thumb":"/storage/thumbs/78/0785b0f10a3eb8ebee7d4e87.jpg","is_video":true},{"id":12563,"share_token":"691c66b9","thumb":"/storage/thumbs/78/ad48e6f565364188c2ef8e43.jpg","is_video":false},{"id":12562,"share_token":"b005a48a","thumb":"/storage/thumbs/78/0e20e74f8bfec25a5702a3ad.jpg","is_video":true},{"id":12561,"share_token":"80302791","thumb":"/storage/thumbs/78/7ffcc33f57a2b7f998a32a30.jpg","is_video":false},{"id":12560,"share_token":"46864aa5","thumb":"/storage/thumbs/78/c5a1949e99ad2c28e0e730d0.jpg","is_video":true},{"id":12559,"share_token":"f0e81ca3","thumb":"/storage/thumbs/78/a91f2fbc97697488d4ae9afa.jpg","is_video":false},{"id":12558,"share_token":"442e736a","thumb":"/storage/thumbs/78/ca38fe367b26006227e37179.jpg","is_video":true},{"id":12557,"share_token":"521e1c68","thumb":"/storage/thumbs/78/12a55b546d41b77a0c8f20be.jpg","is_video":false},{"id":12556,"share_token":"2cdd997a","thumb":"/storage/thumbs/78/e7753bfaa07dff96d0b0ccda.jpg","is_video":true},{"id":12555,"share_token":"06bac3f2","thumb":"/storage/thumbs/78/24a5ad0a8a96103d69d8020c.jpg","is_video":false},{"id":12554,"share_token":"724ace07","thumb":"/storage/thumbs/78/97bc6317f60ed4dbe428a895.jpg","is_video":true},{"id":12553,"share_token":"7e2a1e48","thumb":"/storage/thumbs/78/1482cb99337c5f077a121acd.jpg","is_video":false},{"id":12552,"share_token":"430e2f33","thumb":"/storage/thumbs/78/581569a721696b1164df8323.jpg","is_video":true},{"id":12551,"share_token":"41512e6c","thumb":"/storage/thumbs/78/7f940322e4de6c9e860577bf.jpg","is_video":false},{"id":12550,"share_token":"8bc3d85f","thumb":"/storage/thumbs/78/1f8d46b236c64d70a96a6da7.jpg","is_video":true},{"id":12549,"share_token":"8f8149e9","thumb":"/storage/thumbs/78/e9ba87b3f18dbb11f93aa3fd.jpg","is_video":false},{"id":12548,"share_token":"d017a97f","thumb":"/storage/thumbs/78/2669737fb590561c8080642c.jpg","is_video":true},{"id":12547,"share_token":"add0875f","thumb":"/storage/thumbs/78/95e1c730de52cf4a740e1a56.jpg","is_video":false},{"id":12546,"share_token":"f3d2ae71","thumb":"/storage/thumbs/78/61e69784cd7ba510dc68ea2f.jpg","is_video":true},{"id":12545,"share_token":"3ef30429","thumb":"/storage/thumbs/78/12d5221450abead3c479585e.jpg","is_video":false},{"id":12544,"share_token":"c8ed6a59","thumb":"/storage/thumbs/78/0e5d0a3ed7eab01e4d14abcc.jpg","is_video":true},{"id":12543,"share_token":"dc5e09a0","thumb":"/storage/thumbs/78/80679530bcc6d50da1d8072f.jpg","is_video":false},{"id":12542,"share_token":"fc7cd450","thumb":"/storage/thumbs/78/5b2aa8350b765a7d3b017487.jpg","is_video":true},{"id":12541,"share_token":"e0c6b9a6","thumb":"/storage/thumbs/78/8c778c9c66a7234d6e5843be.jpg","is_video":false},{"id":12540,"share_token":"34d7a753","thumb":"/storage/thumbs/78/86d5fe6827bf378ade260ec7.jpg","is_video":true},{"id":12539,"share_token":"056756cf","thumb":"/storage/thumbs/78/6ebdb0e1fa6f81c1251f3dca.jpg","is_video":false},{"id":12538,"share_token":"3c0c96ce","thumb":"/storage/thumbs/78/feba12bb438cdad1fce8733c.jpg","is_video":true},{"id":12537,"share_token":"40c0f0e2","thumb":"/storage/thumbs/78/9fa6075976b808d3fd3290a4.jpg","is_video":false},{"id":12536,"share_token":"f367eb59","thumb":"/storage/thumbs/78/f6d59fa5d7464d1811882154.jpg","is_video":true},{"id":12535,"share_token":"748f4ac1","thumb":"/storage/thumbs/78/66df9dc01f36834bae03ab65.jpg","is_video":false},{"id":12534,"share_token":"0850f78e","thumb":"/storage/thumbs/78/582ffe7ee939086af6d1da06.jpg","is_video":true},{"id":12533,"share_token":"f9331364","thumb":"/storage/thumbs/78/3f63960a49c35b7407c4e70d.jpg","is_video":false},{"id":12532,"share_token":"a05b8e8e","thumb":"/storage/thumbs/78/efaad283c0557009177d57b3.jpg","is_video":true},{"id":12531,"share_token":"3d32e670","thumb":"/storage/thumbs/78/33affc1af0c79fc7bd2be83a.jpg","is_video":false},{"id":12530,"share_token":"1b6ddeae","thumb":"/storage/thumbs/78/28158e513303aa22e5efecbb.jpg","is_video":true},{"id":12529,"share_token":"15a31865","thumb":"/storage/thumbs/78/0b96b3d014f169930f58a92b.jpg","is_video":false},{"id":12528,"share_token":"b4e6f5f0","thumb":"/storage/thumbs/78/90cffcc2c2d0c7062286a270.jpg","is_video":true},{"id":12527,"share_token":"d4972633","thumb":"/storage/thumbs/78/063b2bed7d7a2d14acb3b350.jpg","is_video":false},{"id":12526,"share_token":"b6fb7f61","thumb":"/storage/thumbs/78/d500eb87ccad440a026ed1ab.jpg","is_video":true},{"id":12525,"share_token":"5ec4c365","thumb":"/storage/thumbs/78/b32583d4bc161965ed4b46e3.jpg","is_video":false},{"id":12524,"share_token":"b722343b","thumb":"/storage/thumbs/78/06690d453000bfa08c3f0c28.jpg","is_video":true},{"id":12523,"share_token":"651e5a8b","thumb":"/storage/thumbs/78/e05ae6229d3be20d97e321d7.jpg","is_video":false},{"id":12522,"share_token":"513d5a60","thumb":"/storage/thumbs/78/5a14922844459681d68436e9.jpg","is_video":true},{"id":12521,"share_token":"471f132d","thumb":"/storage/thumbs/78/21843de924b6a199a19a531f.jpg","is_video":false},{"id":12520,"share_token":"ac65f257","thumb":"/storage/thumbs/78/1eaa5dc1eb4ce879ea274cae.jpg","is_video":true},{"id":12519,"share_token":"5bfe2405","thumb":"/storage/thumbs/78/4bb055b5f9c46cf4751859d7.jpg","is_video":false},{"id":12518,"share_token":"983fddb5","thumb":"/storage/thumbs/78/74bc2da356ca5baa6747262c.jpg","is_video":true},{"id":12517,"share_token":"f2b02a20","thumb":"/storage/thumbs/78/b6d0fa0ed9812fbea7003a4e.jpg","is_video":false},{"id":12516,"share_token":"102209bb","thumb":"/storage/thumbs/78/45ae5fcd17c45ef201fe0555.jpg","is_video":true},{"id":12515,"share_token":"98f819fc","thumb":"/storage/thumbs/78/2226392cd37334dfc4f545f6.jpg","is_video":false},{"id":12514,"share_token":"2ea02f45","thumb":"/storage/thumbs/78/ff4e9f9806b4c38cea9c71e5.jpg","is_video":true},{"id":12513,"share_token":"804ec3bb","thumb":"/storage/thumbs/78/29101d193585670cf53130f3.jpg","is_video":false},{"id":12512,"share_token":"1a409343","thumb":"/storage/thumbs/78/3ed29c11ff822d3b27fddb77.jpg","is_video":true},{"id":12511,"share_token":"f1277e7f","thumb":"/storage/thumbs/78/d21b3a24c691e5b9ceefdc16.jpg","is_video":false},{"id":12510,"share_token":"1f346904","thumb":"/storage/thumbs/78/a349868ee7fb80db370e9021.jpg","is_video":true},{"id":12509,"share_token":"c5b6df23","thumb":"/storage/thumbs/78/bb7f21e9552753dbed848e2b.jpg","is_video":false},{"id":12508,"share_token":"eaa48f17","thumb":"/storage/thumbs/78/48ddb20bd2602981d42ea913.jpg","is_video":true},{"id":12507,"share_token":"21955a5f","thumb":"/storage/thumbs/78/03cd6d244af3b75df195b549.jpg","is_video":false},{"id":12506,"share_token":"2cce2fc9","thumb":"/storage/thumbs/78/60311b48ac81b02d3208785a.jpg","is_video":true},{"id":12505,"share_token":"5bc55ec3","thumb":"/storage/thumbs/78/070dd59abec39d5b56788d28.jpg","is_video":false},{"id":12504,"share_token":"54ad61af","thumb":"/storage/thumbs/78/e6b721486ba8f354a768c798.jpg","is_video":true},{"id":12503,"share_token":"3ce4043c","thumb":"/storage/thumbs/78/3b50a866f14d82bc30d64e30.jpg","is_video":false},{"id":12502,"share_token":"f4b90228","thumb":"/storage/thumbs/78/e9907e15ae34435a4b9c1c07.jpg","is_video":true},{"id":12501,"share_token":"8d8d0b74","thumb":"/storage/thumbs/78/c31f7c6bdc75703e30400d91.jpg","is_video":false},{"id":12500,"share_token":"2d76babc","thumb":"/storage/thumbs/78/cb87c50232f2bc46704b2913.jpg","is_video":true},{"id":12499,"share_token":"f224b855","thumb":"/storage/thumbs/78/8cf3b6df74842fcd87d09478.jpg","is_video":false},{"id":12498,"share_token":"87f2f68f","thumb":"/storage/thumbs/78/2ea6f7ee38fc94d825cec2c9.jpg","is_video":true},{"id":12497,"share_token":"8c210a9a","thumb":"/storage/thumbs/78/55753db87ba120767aaab485.jpg","is_video":false},{"id":12496,"share_token":"2ba88529","thumb":"/storage/thumbs/78/28bab706761ca4ad392de201.jpg","is_video":true},{"id":12495,"share_token":"e39375f7","thumb":"/storage/thumbs/78/4d91a67e52ae3fca850ce1ac.jpg","is_video":false},{"id":12494,"share_token":"c4bf6a53","thumb":"/storage/thumbs/78/17e85a1e2d446c8466070276.jpg","is_video":true},{"id":12493,"share_token":"9d60b2bb","thumb":"/storage/thumbs/78/2a2d1b40aaf37fa590b2f5fb.jpg","is_video":false},{"id":12492,"share_token":"bd072e8f","thumb":"/storage/thumbs/78/4bfc11128b294573c289a92d.jpg","is_video":true},{"id":12491,"share_token":"3478ee4f","thumb":"/storage/thumbs/78/39db7e3ec287c902e35ae076.jpg","is_video":false},{"id":12490,"share_token":"620062ae","thumb":"/storage/thumbs/78/5a45e573190cda24d9a31bda.jpg","is_video":true},{"id":12489,"share_token":"91dd1d1d","thumb":"/storage/thumbs/78/794b6daa8f1b19e4715fdcf9.jpg","is_video":false},{"id":12488,"share_token":"104d16d3","thumb":"/storage/thumbs/78/afaa07f8c19f18bc54bccb6f.jpg","is_video":true},{"id":12487,"share_token":"56403bd7","thumb":"/storage/thumbs/78/bb2fe8b6eedab42d77792967.jpg","is_video":false},{"id":12486,"share_token":"8e5c0540","thumb":"/storage/thumbs/78/4917c7917d7d8476d5e352fa.jpg","is_video":true},{"id":12485,"share_token":"38f484cc","thumb":"/storage/thumbs/78/dae46aae6667293708d2468f.jpg","is_video":false},{"id":12484,"share_token":"0d67e0fd","thumb":"/storage/thumbs/78/d433816f94b61704a9773699.jpg","is_video":true},{"id":12483,"share_token":"7d7e4617","thumb":"/storage/thumbs/78/3d294e0539b051c7161c2d17.jpg","is_video":false},{"id":12482,"share_token":"adef45b2","thumb":"/storage/thumbs/78/2992896b2110359f409e390f.jpg","is_video":true},{"id":12481,"share_token":"8145f87c","thumb":"/storage/thumbs/78/c5f65f7c1e3840c3ddef7e19.jpg","is_video":false},{"id":12480,"share_token":"44e32809","thumb":"/storage/thumbs/78/3052764f5a5ca07f23d3af62.jpg","is_video":true},{"id":12479,"share_token":"5a9b9959","thumb":"/storage/thumbs/78/d458e37754f257bbdaa7e616.jpg","is_video":false},{"id":12478,"share_token":"ccc0a460","thumb":"/storage/thumbs/78/24e829fd021b76abe33b08f6.jpg","is_video":true},{"id":12477,"share_token":"022976c0","thumb":"/storage/thumbs/78/54d34209267914bb55d1ba8b.jpg","is_video":false},{"id":12476,"share_token":"be3d2235","thumb":"/storage/thumbs/78/4d264bd70493ce86d9be04b6.jpg","is_video":true},{"id":12475,"share_token":"95a0b783","thumb":"/storage/thumbs/78/0da73a9dab97c7cce6888e3a.jpg","is_video":false},{"id":12474,"share_token":"4a228a01","thumb":"/storage/thumbs/78/7c11f248d044297ca4c5e37f.jpg","is_video":true},{"id":12473,"share_token":"1586f49e","thumb":"/storage/thumbs/78/e1d92bf05dc033b3572a3498.jpg","is_video":false},{"id":12472,"share_token":"b9885ef1","thumb":"/storage/thumbs/78/f88d052295164ef7c55dd45a.jpg","is_video":true},{"id":12471,"share_token":"8abe545a","thumb":"/storage/thumbs/78/c40ecb1da8610b4cd3877714.jpg","is_video":false},{"id":12470,"share_token":"ec6e50d3","thumb":"/storage/thumbs/78/3b762eb7678f9423afdfd39a.jpg","is_video":true},{"id":12469,"share_token":"160b4703","thumb":"/storage/thumbs/78/9bc7a876dddffc155b9f5e81.jpg","is_video":false},{"id":12468,"share_token":"1ecde8e4","thumb":"/storage/thumbs/78/0bd7599346a515befc95a467.jpg","is_video":true},{"id":12467,"share_token":"d8eebe76","thumb":"/storage/thumbs/78/f8a1646f18f69056ce2eeccf.jpg","is_video":false},{"id":12466,"share_token":"0376cf73","thumb":"/storage/thumbs/78/0de55c0093520e26da2fb12e.jpg","is_video":true},{"id":12465,"share_token":"6cba3615","thumb":"/storage/thumbs/78/12d31e4d08c62a31194681e7.jpg","is_video":false},{"id":12464,"share_token":"3564ff54","thumb":"/storage/thumbs/78/63cffacbd80fb470b0de3c3c.jpg","is_video":true},{"id":12463,"share_token":"59f15338","thumb":"/storage/thumbs/78/01ae2eeaba26192d4d3cff96.jpg","is_video":false},{"id":12462,"share_token":"b0602da8","thumb":"/storage/thumbs/78/9a6978c2c2403d3d5262f5b4.jpg","is_video":true},{"id":12461,"share_token":"972c4be3","thumb":"/storage/thumbs/78/825e5bc5c5f8c0ed643f7d06.jpg","is_video":false},{"id":12460,"share_token":"f8841250","thumb":"/storage/thumbs/78/8cd3d1c48f1f17b570613092.jpg","is_video":true},{"id":12459,"share_token":"332de2a6","thumb":"/storage/thumbs/78/fdd02534be64eccfa710dc8b.jpg","is_video":false},{"id":12458,"share_token":"3b7bec87","thumb":"/storage/thumbs/78/6abda22c47df1a3c38758215.jpg","is_video":true},{"id":12457,"share_token":"c485e8b9","thumb":"/storage/thumbs/78/132bc694ce544ae7ab749853.jpg","is_video":false},{"id":12456,"share_token":"2daf8d7d","thumb":"/storage/thumbs/78/fc8a8f558b6b0670a7b3dd61.jpg","is_video":true},{"id":12455,"share_token":"b8de9e11","thumb":"/storage/thumbs/78/5706d25af57b4949db245c3d.jpg","is_video":false},{"id":12454,"share_token":"9570f0e6","thumb":"/storage/thumbs/78/8e273ab898de77732953ab99.jpg","is_video":true},{"id":12453,"share_token":"3b3d6eba","thumb":"/storage/thumbs/78/b0211a28b7ca3dc89760e6d9.jpg","is_video":false},{"id":12452,"share_token":"e12b5243","thumb":"/storage/thumbs/78/f62f2ff80e137167d9186b18.jpg","is_video":true},{"id":12451,"share_token":"4256bff6","thumb":"/storage/thumbs/78/0992dbf3b0ce6b6335b69bed.jpg","is_video":false},{"id":12450,"share_token":"e4645724","thumb":"/storage/thumbs/78/63660ad4d9ab0943fe5942cc.jpg","is_video":true},{"id":12449,"share_token":"c10a1b97","thumb":"/storage/thumbs/78/9d94c302b92c5082d7b84c77.jpg","is_video":false},{"id":12448,"share_token":"0c720f6f","thumb":"/storage/thumbs/78/9582d31401690e65f6834cd7.jpg","is_video":true},{"id":12447,"share_token":"41e4fe27","thumb":"/storage/thumbs/78/db1e02d54a7ef87ae124aa91.jpg","is_video":false},{"id":12446,"share_token":"4ba26a0c","thumb":"/storage/thumbs/78/e2540bf80c1e68c60bbe10aa.jpg","is_video":true},{"id":12445,"share_token":"06c54115","thumb":"/storage/thumbs/78/01cf0bb4e222692738ebd57f.jpg","is_video":false},{"id":12444,"share_token":"93cbc4dc","thumb":"/storage/thumbs/78/5dd08dcd5040e56cfb514cf6.jpg","is_video":true},{"id":12443,"share_token":"99435fcb","thumb":"/storage/thumbs/78/082b55c18a2665c153448a72.jpg","is_video":false},{"id":12442,"share_token":"d1fd8fc4","thumb":"/storage/thumbs/78/2a829d529d8f0247ae041ed8.jpg","is_video":true},{"id":12441,"share_token":"407b4cc7","thumb":"/storage/thumbs/78/20e5e89454e131fc3b185840.jpg","is_video":false},{"id":12440,"share_token":"568ab0a3","thumb":"/storage/thumbs/78/c630cf5c15efe779cd3d6a34.jpg","is_video":true},{"id":12439,"share_token":"a4c1b62c","thumb":"/storage/thumbs/78/d6d03b8dc64db743e56c84fe.jpg","is_video":false},{"id":12438,"share_token":"81179b78","thumb":"/storage/thumbs/78/1dcd71b38d75ec205677a2ec.jpg","is_video":true},{"id":12437,"share_token":"13371be4","thumb":"/storage/thumbs/78/1300eee067b38b4467ab7110.jpg","is_video":false},{"id":12436,"share_token":"930ee014","thumb":"/storage/thumbs/78/799a012f8f23dc87b68d5ffb.jpg","is_video":true},{"id":12435,"share_token":"c7928205","thumb":"/storage/thumbs/78/4ce78b6220ca32ddda924454.jpg","is_video":false},{"id":12434,"share_token":"72eeec0d","thumb":"/storage/thumbs/78/e40ce5e0e8548f9d95a50a9e.jpg","is_video":true},{"id":12433,"share_token":"53a202f8","thumb":"/storage/thumbs/78/ad07556100a47c16a157341c.jpg","is_video":false},{"id":12432,"share_token":"88d0d78d","thumb":"/storage/thumbs/78/f66dbd6945ed320593265e3d.jpg","is_video":true},{"id":12431,"share_token":"337b1faa","thumb":"/storage/thumbs/78/2310afa5e8de3e3fb741d508.jpg","is_video":false},{"id":12430,"share_token":"c5830c84","thumb":"/storage/thumbs/78/d9d68f7764358feac38b2504.jpg","is_video":true},{"id":12429,"share_token":"a7b96b57","thumb":"/storage/thumbs/78/e32cd1f071c31741c034526e.jpg","is_video":false},{"id":12428,"share_token":"1560598c","thumb":"/storage/thumbs/78/4f1c08ca2613ae3cde5f3337.jpg","is_video":true},{"id":12427,"share_token":"5a659063","thumb":"/storage/thumbs/78/a533638f0deb226e2b8644a7.jpg","is_video":false},{"id":12426,"share_token":"12a443cf","thumb":"/storage/thumbs/78/d4213e730ade9e26ab183a6e.jpg","is_video":true},{"id":12425,"share_token":"4ef32962","thumb":"/storage/thumbs/78/7cb49d5064d018ae9ee294db.jpg","is_video":false},{"id":12424,"share_token":"71891b7a","thumb":"/storage/thumbs/78/1382bd6fd5721057006711ab.jpg","is_video":true},{"id":12423,"share_token":"0ce93d97","thumb":"/storage/thumbs/78/0e1a7d584565a2703dad9a7b.jpg","is_video":false}];
    const WEDDING_INITIAL_CACHE = [{"id":"1vONpAejtUhbGlXsDmNtxCQbZr30UtHtn","name":"20261114_203839.551.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1vONpAejtUhbGlXsDmNtxCQbZr30UtHtn=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1vONpAejtUhbGlXsDmNtxCQbZr30UtHtn=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1vONpAejtUhbGlXsDmNtxCQbZr30UtHtn=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1vONpAejtUhbGlXsDmNtxCQbZr30UtHtn=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1VExRWvHNJmRT-8ZMIFKUy6bTNQaqP4oB","name":"20261114_204243.767.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1VExRWvHNJmRT-8ZMIFKUy6bTNQaqP4oB=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1VExRWvHNJmRT-8ZMIFKUy6bTNQaqP4oB=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1VExRWvHNJmRT-8ZMIFKUy6bTNQaqP4oB=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1VExRWvHNJmRT-8ZMIFKUy6bTNQaqP4oB=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1pAmhhqhtXF-6An3wg_7_E43bPEU8nAXg","name":"20261114_204243.767.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1pAmhhqhtXF-6An3wg_7_E43bPEU8nAXg=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1pAmhhqhtXF-6An3wg_7_E43bPEU8nAXg=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1pAmhhqhtXF-6An3wg_7_E43bPEU8nAXg=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1pAmhhqhtXF-6An3wg_7_E43bPEU8nAXg=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1VriuYPy6AqXoJH3XdQYP6X-TKvk08rkL","name":"20261114_204246.821.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1VriuYPy6AqXoJH3XdQYP6X-TKvk08rkL=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1VriuYPy6AqXoJH3XdQYP6X-TKvk08rkL=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1VriuYPy6AqXoJH3XdQYP6X-TKvk08rkL=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1VriuYPy6AqXoJH3XdQYP6X-TKvk08rkL=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1eMdgNeysvFWPezmjGrhQrJhotKjQxVE7","name":"20261114_204246.821.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1eMdgNeysvFWPezmjGrhQrJhotKjQxVE7=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1eMdgNeysvFWPezmjGrhQrJhotKjQxVE7=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1eMdgNeysvFWPezmjGrhQrJhotKjQxVE7=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1eMdgNeysvFWPezmjGrhQrJhotKjQxVE7=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1MXAmWuRUFifVBfGcIiuD6uz9zyMLZFyN","name":"20261114_204248.113.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1MXAmWuRUFifVBfGcIiuD6uz9zyMLZFyN=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1MXAmWuRUFifVBfGcIiuD6uz9zyMLZFyN=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1MXAmWuRUFifVBfGcIiuD6uz9zyMLZFyN=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1MXAmWuRUFifVBfGcIiuD6uz9zyMLZFyN=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1ZNXBMnA-r7mwwlVI3c24qMsdJA_ccF53","name":"20261114_204304.827.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1ZNXBMnA-r7mwwlVI3c24qMsdJA_ccF53=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1ZNXBMnA-r7mwwlVI3c24qMsdJA_ccF53=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1ZNXBMnA-r7mwwlVI3c24qMsdJA_ccF53=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1ZNXBMnA-r7mwwlVI3c24qMsdJA_ccF53=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"10d1dBmyuD3IlhNTKsh44YZH923qFQQKI","name":"20261114_204305.568.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/10d1dBmyuD3IlhNTKsh44YZH923qFQQKI=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/10d1dBmyuD3IlhNTKsh44YZH923qFQQKI=w3200","highResUrl":"https://lh3.googleusercontent.com/d/10d1dBmyuD3IlhNTKsh44YZH923qFQQKI=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/10d1dBmyuD3IlhNTKsh44YZH923qFQQKI=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1oLc4wXFaJOuTjYDi5shdHdsVjrekbd3O","name":"20261114_204305.568.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1oLc4wXFaJOuTjYDi5shdHdsVjrekbd3O=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1oLc4wXFaJOuTjYDi5shdHdsVjrekbd3O=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1oLc4wXFaJOuTjYDi5shdHdsVjrekbd3O=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1oLc4wXFaJOuTjYDi5shdHdsVjrekbd3O=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1tbYC03NQUvkUUDG-wpkjJ01O-kqxOc-4","name":"20261114_204625.631.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1tbYC03NQUvkUUDG-wpkjJ01O-kqxOc-4=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1tbYC03NQUvkUUDG-wpkjJ01O-kqxOc-4=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1tbYC03NQUvkUUDG-wpkjJ01O-kqxOc-4=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1tbYC03NQUvkUUDG-wpkjJ01O-kqxOc-4=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1UF_PtCTbj_U7xjBbw42Hv6ZlhMY3A2z5","name":"20261114_204625.631.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1UF_PtCTbj_U7xjBbw42Hv6ZlhMY3A2z5=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1UF_PtCTbj_U7xjBbw42Hv6ZlhMY3A2z5=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1UF_PtCTbj_U7xjBbw42Hv6ZlhMY3A2z5=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1UF_PtCTbj_U7xjBbw42Hv6ZlhMY3A2z5=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1GRx5pvg4fssTMrkBug34C3sHum1IA5QX","name":"20261114_204626.443.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1GRx5pvg4fssTMrkBug34C3sHum1IA5QX=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1GRx5pvg4fssTMrkBug34C3sHum1IA5QX=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1GRx5pvg4fssTMrkBug34C3sHum1IA5QX=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1GRx5pvg4fssTMrkBug34C3sHum1IA5QX=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1v32whvfUNAf6KfA5g16P0z1Et5V_0TdT","name":"20261114_204626.443.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1v32whvfUNAf6KfA5g16P0z1Et5V_0TdT=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1v32whvfUNAf6KfA5g16P0z1Et5V_0TdT=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1v32whvfUNAf6KfA5g16P0z1Et5V_0TdT=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1v32whvfUNAf6KfA5g16P0z1Et5V_0TdT=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1cs1oanLcSKZ9jZ1Q83U-kzAg3Iv7dyhK","name":"20261114_204639.444.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1cs1oanLcSKZ9jZ1Q83U-kzAg3Iv7dyhK=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1cs1oanLcSKZ9jZ1Q83U-kzAg3Iv7dyhK=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1cs1oanLcSKZ9jZ1Q83U-kzAg3Iv7dyhK=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1cs1oanLcSKZ9jZ1Q83U-kzAg3Iv7dyhK=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1nfSgENzfEo2F9tlrY9khXjVJrbZ1Wl0I","name":"20261114_204639.444.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1nfSgENzfEo2F9tlrY9khXjVJrbZ1Wl0I=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1nfSgENzfEo2F9tlrY9khXjVJrbZ1Wl0I=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1nfSgENzfEo2F9tlrY9khXjVJrbZ1Wl0I=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1nfSgENzfEo2F9tlrY9khXjVJrbZ1Wl0I=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1zE4nAwfaYCe_Y6YdRJ3A1pgwWKVU6mAF","name":"20261114_204641.533.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1zE4nAwfaYCe_Y6YdRJ3A1pgwWKVU6mAF=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1zE4nAwfaYCe_Y6YdRJ3A1pgwWKVU6mAF=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1zE4nAwfaYCe_Y6YdRJ3A1pgwWKVU6mAF=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1zE4nAwfaYCe_Y6YdRJ3A1pgwWKVU6mAF=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"13oVx0gtbnRG5ckY8VCv817WJN-Xpu75R","name":"20261114_204641.533.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/13oVx0gtbnRG5ckY8VCv817WJN-Xpu75R=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/13oVx0gtbnRG5ckY8VCv817WJN-Xpu75R=w3200","highResUrl":"https://lh3.googleusercontent.com/d/13oVx0gtbnRG5ckY8VCv817WJN-Xpu75R=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/13oVx0gtbnRG5ckY8VCv817WJN-Xpu75R=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1mGVIgPiEdhsVH9Uv32UvwrmFWcchacBm","name":"20261114_204851.613.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1mGVIgPiEdhsVH9Uv32UvwrmFWcchacBm=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1mGVIgPiEdhsVH9Uv32UvwrmFWcchacBm=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1mGVIgPiEdhsVH9Uv32UvwrmFWcchacBm=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1mGVIgPiEdhsVH9Uv32UvwrmFWcchacBm=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1TVSDIEMIQlXygbKOnDH1Zeb-WLfgpxf5","name":"20261114_204854.618.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1TVSDIEMIQlXygbKOnDH1Zeb-WLfgpxf5=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1TVSDIEMIQlXygbKOnDH1Zeb-WLfgpxf5=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1TVSDIEMIQlXygbKOnDH1Zeb-WLfgpxf5=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1TVSDIEMIQlXygbKOnDH1Zeb-WLfgpxf5=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1260bwUpTlhATzxnuJV9eefsmQ6mSzj1n","name":"20261114_204854.618.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1260bwUpTlhATzxnuJV9eefsmQ6mSzj1n=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1260bwUpTlhATzxnuJV9eefsmQ6mSzj1n=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1260bwUpTlhATzxnuJV9eefsmQ6mSzj1n=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1260bwUpTlhATzxnuJV9eefsmQ6mSzj1n=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1C6TnuZYY79o3UgpdhKX_CihnJu1CA-1t","name":"20261114_204904.266.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1C6TnuZYY79o3UgpdhKX_CihnJu1CA-1t=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1C6TnuZYY79o3UgpdhKX_CihnJu1CA-1t=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1C6TnuZYY79o3UgpdhKX_CihnJu1CA-1t=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1C6TnuZYY79o3UgpdhKX_CihnJu1CA-1t=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1LGXba6vg0byMQ-rWN4PpzRmiN1YERc-k","name":"20261114_204905.457.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1LGXba6vg0byMQ-rWN4PpzRmiN1YERc-k=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1LGXba6vg0byMQ-rWN4PpzRmiN1YERc-k=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1LGXba6vg0byMQ-rWN4PpzRmiN1YERc-k=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1LGXba6vg0byMQ-rWN4PpzRmiN1YERc-k=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1LvGPTOJFfMwXqlhsS0wPAV3sxH7JYQ97","name":"20261114_204905.457.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1LvGPTOJFfMwXqlhsS0wPAV3sxH7JYQ97=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1LvGPTOJFfMwXqlhsS0wPAV3sxH7JYQ97=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1LvGPTOJFfMwXqlhsS0wPAV3sxH7JYQ97=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1LvGPTOJFfMwXqlhsS0wPAV3sxH7JYQ97=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1iq5RMp5-StKAE759VWDg7KZro_NMYaK0","name":"20261114_205033.924.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1iq5RMp5-StKAE759VWDg7KZro_NMYaK0=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1iq5RMp5-StKAE759VWDg7KZro_NMYaK0=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1iq5RMp5-StKAE759VWDg7KZro_NMYaK0=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1iq5RMp5-StKAE759VWDg7KZro_NMYaK0=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1_8lmxoRrCZZlcCVv0htdEn1X-vS9EPFK","name":"20261114_205033.924.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1_8lmxoRrCZZlcCVv0htdEn1X-vS9EPFK=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1_8lmxoRrCZZlcCVv0htdEn1X-vS9EPFK=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1_8lmxoRrCZZlcCVv0htdEn1X-vS9EPFK=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1_8lmxoRrCZZlcCVv0htdEn1X-vS9EPFK=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"11Cx_bgDPTgcrVVxi5eYtjRrphJ7rUwqV","name":"20261114_205034.572.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/11Cx_bgDPTgcrVVxi5eYtjRrphJ7rUwqV=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/11Cx_bgDPTgcrVVxi5eYtjRrphJ7rUwqV=w3200","highResUrl":"https://lh3.googleusercontent.com/d/11Cx_bgDPTgcrVVxi5eYtjRrphJ7rUwqV=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/11Cx_bgDPTgcrVVxi5eYtjRrphJ7rUwqV=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1Dt7xY45ID-JP3gavC0q66t8VUnPTg88s","name":"20261114_205035.046.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1Dt7xY45ID-JP3gavC0q66t8VUnPTg88s=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1Dt7xY45ID-JP3gavC0q66t8VUnPTg88s=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1Dt7xY45ID-JP3gavC0q66t8VUnPTg88s=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1Dt7xY45ID-JP3gavC0q66t8VUnPTg88s=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"18V58PouLGWLnpG-7GpdtGjcO21jL6WfX","name":"20261114_205035.046.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/18V58PouLGWLnpG-7GpdtGjcO21jL6WfX=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/18V58PouLGWLnpG-7GpdtGjcO21jL6WfX=w3200","highResUrl":"https://lh3.googleusercontent.com/d/18V58PouLGWLnpG-7GpdtGjcO21jL6WfX=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/18V58PouLGWLnpG-7GpdtGjcO21jL6WfX=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1O-hP6T-jERI35bp24PbiF8Z7cZWMZB6c","name":"20261114_205044.483.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1O-hP6T-jERI35bp24PbiF8Z7cZWMZB6c=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1O-hP6T-jERI35bp24PbiF8Z7cZWMZB6c=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1O-hP6T-jERI35bp24PbiF8Z7cZWMZB6c=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1O-hP6T-jERI35bp24PbiF8Z7cZWMZB6c=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1UetD7so61KmWigo25IScTokb01ttFr_p","name":"20261114_205044.483.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1UetD7so61KmWigo25IScTokb01ttFr_p=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1UetD7so61KmWigo25IScTokb01ttFr_p=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1UetD7so61KmWigo25IScTokb01ttFr_p=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1UetD7so61KmWigo25IScTokb01ttFr_p=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1lDvtfi8bz0vPGaQLJbmetM38Btw5NNu5","name":"20261114_205045.217.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1lDvtfi8bz0vPGaQLJbmetM38Btw5NNu5=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1lDvtfi8bz0vPGaQLJbmetM38Btw5NNu5=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1lDvtfi8bz0vPGaQLJbmetM38Btw5NNu5=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1lDvtfi8bz0vPGaQLJbmetM38Btw5NNu5=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1vcbea8LM-h0Tg4M67SKhoUOW-SZP30JA","name":"20261114_205045.217.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1vcbea8LM-h0Tg4M67SKhoUOW-SZP30JA=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1vcbea8LM-h0Tg4M67SKhoUOW-SZP30JA=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1vcbea8LM-h0Tg4M67SKhoUOW-SZP30JA=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1vcbea8LM-h0Tg4M67SKhoUOW-SZP30JA=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1oATobKtHIMnUEPwHfvxyIKMPuLFB0T55","name":"20261114_205221.364.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1oATobKtHIMnUEPwHfvxyIKMPuLFB0T55=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1oATobKtHIMnUEPwHfvxyIKMPuLFB0T55=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1oATobKtHIMnUEPwHfvxyIKMPuLFB0T55=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1oATobKtHIMnUEPwHfvxyIKMPuLFB0T55=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1FeoW9DSxIRizhPkbay-rwB247yELO886","name":"20261114_205221.364.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1FeoW9DSxIRizhPkbay-rwB247yELO886=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1FeoW9DSxIRizhPkbay-rwB247yELO886=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1FeoW9DSxIRizhPkbay-rwB247yELO886=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1FeoW9DSxIRizhPkbay-rwB247yELO886=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"19Z2y93CbuXAXQYdO8xvAHlfhzCAxSgyI","name":"20261114_205222.011.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/19Z2y93CbuXAXQYdO8xvAHlfhzCAxSgyI=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/19Z2y93CbuXAXQYdO8xvAHlfhzCAxSgyI=w3200","highResUrl":"https://lh3.googleusercontent.com/d/19Z2y93CbuXAXQYdO8xvAHlfhzCAxSgyI=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/19Z2y93CbuXAXQYdO8xvAHlfhzCAxSgyI=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1H4pu4SlbH4dr3wjgym_58DcPMRfdWsL_","name":"20261114_205222.011.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1H4pu4SlbH4dr3wjgym_58DcPMRfdWsL_=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1H4pu4SlbH4dr3wjgym_58DcPMRfdWsL_=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1H4pu4SlbH4dr3wjgym_58DcPMRfdWsL_=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1H4pu4SlbH4dr3wjgym_58DcPMRfdWsL_=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1blO23rrIwMJfwxUOIXhsGUOLhdsUhTlb","name":"20261114_205228.510.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1blO23rrIwMJfwxUOIXhsGUOLhdsUhTlb=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1blO23rrIwMJfwxUOIXhsGUOLhdsUhTlb=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1blO23rrIwMJfwxUOIXhsGUOLhdsUhTlb=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1blO23rrIwMJfwxUOIXhsGUOLhdsUhTlb=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1GBm4zv_UfKKcc7l5ygd5u_X_oQveUq9Q","name":"20261114_205228.510.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1GBm4zv_UfKKcc7l5ygd5u_X_oQveUq9Q=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1GBm4zv_UfKKcc7l5ygd5u_X_oQveUq9Q=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1GBm4zv_UfKKcc7l5ygd5u_X_oQveUq9Q=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1GBm4zv_UfKKcc7l5ygd5u_X_oQveUq9Q=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1MDdo_rZF55sfLlZIqnLnI1X3LpyxndgH","name":"20261114_205228.933.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1MDdo_rZF55sfLlZIqnLnI1X3LpyxndgH=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1MDdo_rZF55sfLlZIqnLnI1X3LpyxndgH=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1MDdo_rZF55sfLlZIqnLnI1X3LpyxndgH=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1MDdo_rZF55sfLlZIqnLnI1X3LpyxndgH=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1YfBeCeiS6Y7B7W-pEDSdmcgvDVP6FO3o","name":"20261114_205228.933.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1YfBeCeiS6Y7B7W-pEDSdmcgvDVP6FO3o=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1YfBeCeiS6Y7B7W-pEDSdmcgvDVP6FO3o=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1YfBeCeiS6Y7B7W-pEDSdmcgvDVP6FO3o=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1YfBeCeiS6Y7B7W-pEDSdmcgvDVP6FO3o=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1HHrDgszga-azGCOWKOAlBL2Iuzdeevvh","name":"20261114_205417.975.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1HHrDgszga-azGCOWKOAlBL2Iuzdeevvh=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1HHrDgszga-azGCOWKOAlBL2Iuzdeevvh=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1HHrDgszga-azGCOWKOAlBL2Iuzdeevvh=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1HHrDgszga-azGCOWKOAlBL2Iuzdeevvh=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1XhLFGQ6oeuTEKPzwmz8UW-0yP7tUiwpU","name":"20261114_205417.975.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1XhLFGQ6oeuTEKPzwmz8UW-0yP7tUiwpU=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1XhLFGQ6oeuTEKPzwmz8UW-0yP7tUiwpU=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1XhLFGQ6oeuTEKPzwmz8UW-0yP7tUiwpU=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1XhLFGQ6oeuTEKPzwmz8UW-0yP7tUiwpU=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1UlUPqrSfY08NP4cdgi9Y99bZ7MmHqaG5","name":"20261114_205419.249.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1UlUPqrSfY08NP4cdgi9Y99bZ7MmHqaG5=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1UlUPqrSfY08NP4cdgi9Y99bZ7MmHqaG5=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1UlUPqrSfY08NP4cdgi9Y99bZ7MmHqaG5=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1UlUPqrSfY08NP4cdgi9Y99bZ7MmHqaG5=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1HlkbdY7d0fgdSmxYkQxB950uyb5VhCMT","name":"20261114_205419.249.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1HlkbdY7d0fgdSmxYkQxB950uyb5VhCMT=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1HlkbdY7d0fgdSmxYkQxB950uyb5VhCMT=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1HlkbdY7d0fgdSmxYkQxB950uyb5VhCMT=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1HlkbdY7d0fgdSmxYkQxB950uyb5VhCMT=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1c5PM137feRQlBVCra4jeypAsRFjkGEJE","name":"20261114_205640.843.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1c5PM137feRQlBVCra4jeypAsRFjkGEJE=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1c5PM137feRQlBVCra4jeypAsRFjkGEJE=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1c5PM137feRQlBVCra4jeypAsRFjkGEJE=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1c5PM137feRQlBVCra4jeypAsRFjkGEJE=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1_cOjHy324O3N_TZBnSD8Rnx3NCsUbVLV","name":"20261114_205640.843.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1_cOjHy324O3N_TZBnSD8Rnx3NCsUbVLV=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1_cOjHy324O3N_TZBnSD8Rnx3NCsUbVLV=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1_cOjHy324O3N_TZBnSD8Rnx3NCsUbVLV=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1_cOjHy324O3N_TZBnSD8Rnx3NCsUbVLV=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1lQTphu6C22xxpDsXIXTRKFjVB25ghVCJ","name":"20261114_205641.466.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1lQTphu6C22xxpDsXIXTRKFjVB25ghVCJ=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1lQTphu6C22xxpDsXIXTRKFjVB25ghVCJ=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1lQTphu6C22xxpDsXIXTRKFjVB25ghVCJ=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1lQTphu6C22xxpDsXIXTRKFjVB25ghVCJ=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"13KZFwye440nlMP3E5nuz_bspln-uQt5u","name":"20261114_205831.572.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/13KZFwye440nlMP3E5nuz_bspln-uQt5u=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/13KZFwye440nlMP3E5nuz_bspln-uQt5u=w3200","highResUrl":"https://lh3.googleusercontent.com/d/13KZFwye440nlMP3E5nuz_bspln-uQt5u=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/13KZFwye440nlMP3E5nuz_bspln-uQt5u=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1iSneRohx3ittTHPpIpUiFxrNwf-teULS","name":"20261114_205831.572.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1iSneRohx3ittTHPpIpUiFxrNwf-teULS=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1iSneRohx3ittTHPpIpUiFxrNwf-teULS=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1iSneRohx3ittTHPpIpUiFxrNwf-teULS=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1iSneRohx3ittTHPpIpUiFxrNwf-teULS=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1pCwbH1Hpbf4kubbHHxONRIxv55ye_zj3","name":"20261114_205832.242.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1pCwbH1Hpbf4kubbHHxONRIxv55ye_zj3=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1pCwbH1Hpbf4kubbHHxONRIxv55ye_zj3=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1pCwbH1Hpbf4kubbHHxONRIxv55ye_zj3=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1pCwbH1Hpbf4kubbHHxONRIxv55ye_zj3=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1OeUpP5ABkIPwj7mv_jLLao3Pe85J98zG","name":"20261114_205846.347.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1OeUpP5ABkIPwj7mv_jLLao3Pe85J98zG=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1OeUpP5ABkIPwj7mv_jLLao3Pe85J98zG=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1OeUpP5ABkIPwj7mv_jLLao3Pe85J98zG=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1OeUpP5ABkIPwj7mv_jLLao3Pe85J98zG=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"19wcMIYlGHvW8-gbpahBjVAs_CG3WbuOi","name":"20261114_205846.347.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/19wcMIYlGHvW8-gbpahBjVAs_CG3WbuOi=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/19wcMIYlGHvW8-gbpahBjVAs_CG3WbuOi=w3200","highResUrl":"https://lh3.googleusercontent.com/d/19wcMIYlGHvW8-gbpahBjVAs_CG3WbuOi=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/19wcMIYlGHvW8-gbpahBjVAs_CG3WbuOi=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1yxvZRmy63RHabgW59WIvF6Edg06E2tea","name":"20261114_205847.133.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1yxvZRmy63RHabgW59WIvF6Edg06E2tea=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1yxvZRmy63RHabgW59WIvF6Edg06E2tea=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1yxvZRmy63RHabgW59WIvF6Edg06E2tea=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1yxvZRmy63RHabgW59WIvF6Edg06E2tea=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1_YcawPWhzbNdYEwyucAmWcLTrmNJM5VJ","name":"20261114_212218.011.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1_YcawPWhzbNdYEwyucAmWcLTrmNJM5VJ=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1_YcawPWhzbNdYEwyucAmWcLTrmNJM5VJ=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1_YcawPWhzbNdYEwyucAmWcLTrmNJM5VJ=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1_YcawPWhzbNdYEwyucAmWcLTrmNJM5VJ=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1mgAuSTzQTzPKQrWuhTtpKS9DrydVWoWz","name":"20261114_212218.702.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1mgAuSTzQTzPKQrWuhTtpKS9DrydVWoWz=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1mgAuSTzQTzPKQrWuhTtpKS9DrydVWoWz=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1mgAuSTzQTzPKQrWuhTtpKS9DrydVWoWz=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1mgAuSTzQTzPKQrWuhTtpKS9DrydVWoWz=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1-HsHyDT-gtpvksLDChP0cKvTUEj7ALI_","name":"20261114_212502.931.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1-HsHyDT-gtpvksLDChP0cKvTUEj7ALI_=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1-HsHyDT-gtpvksLDChP0cKvTUEj7ALI_=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1-HsHyDT-gtpvksLDChP0cKvTUEj7ALI_=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1-HsHyDT-gtpvksLDChP0cKvTUEj7ALI_=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1xgiDhIUy8fv-ChbyqBsjQkUI_JIjayHH","name":"20261114_212503.351.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1xgiDhIUy8fv-ChbyqBsjQkUI_JIjayHH=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1xgiDhIUy8fv-ChbyqBsjQkUI_JIjayHH=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1xgiDhIUy8fv-ChbyqBsjQkUI_JIjayHH=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1xgiDhIUy8fv-ChbyqBsjQkUI_JIjayHH=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"13_kyjuunikFFQCpCYNZz7wXSAkqVwKnS","name":"20261114_212503.788.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/13_kyjuunikFFQCpCYNZz7wXSAkqVwKnS=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/13_kyjuunikFFQCpCYNZz7wXSAkqVwKnS=w3200","highResUrl":"https://lh3.googleusercontent.com/d/13_kyjuunikFFQCpCYNZz7wXSAkqVwKnS=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/13_kyjuunikFFQCpCYNZz7wXSAkqVwKnS=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1Yy5hiYOaHU856jjf3O4w-qI6dvrTA2kV","name":"20261114_212912.561.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1Yy5hiYOaHU856jjf3O4w-qI6dvrTA2kV=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1Yy5hiYOaHU856jjf3O4w-qI6dvrTA2kV=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1Yy5hiYOaHU856jjf3O4w-qI6dvrTA2kV=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1Yy5hiYOaHU856jjf3O4w-qI6dvrTA2kV=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1kJrvdqRpZSb_q2dqglh7WDvgu-8cyQx0","name":"20261114_212913.684.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1kJrvdqRpZSb_q2dqglh7WDvgu-8cyQx0=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1kJrvdqRpZSb_q2dqglh7WDvgu-8cyQx0=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1kJrvdqRpZSb_q2dqglh7WDvgu-8cyQx0=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1kJrvdqRpZSb_q2dqglh7WDvgu-8cyQx0=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1WVzongXbYnIrn7iUgipHSckECpW8ssBq","name":"20261114_213049.648.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1WVzongXbYnIrn7iUgipHSckECpW8ssBq=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1WVzongXbYnIrn7iUgipHSckECpW8ssBq=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1WVzongXbYnIrn7iUgipHSckECpW8ssBq=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1WVzongXbYnIrn7iUgipHSckECpW8ssBq=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"11_EnWFeh8PkDvqLE4-ueGutEPGCedyxH","name":"20261114_213050.683.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/11_EnWFeh8PkDvqLE4-ueGutEPGCedyxH=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/11_EnWFeh8PkDvqLE4-ueGutEPGCedyxH=w3200","highResUrl":"https://lh3.googleusercontent.com/d/11_EnWFeh8PkDvqLE4-ueGutEPGCedyxH=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/11_EnWFeh8PkDvqLE4-ueGutEPGCedyxH=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1FP4V8KB1hVp4Xe-gZqzBYDfqrIng-fAV","name":"20261114_213051.212.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1FP4V8KB1hVp4Xe-gZqzBYDfqrIng-fAV=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1FP4V8KB1hVp4Xe-gZqzBYDfqrIng-fAV=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1FP4V8KB1hVp4Xe-gZqzBYDfqrIng-fAV=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1FP4V8KB1hVp4Xe-gZqzBYDfqrIng-fAV=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1q4fG22ol-XrzpmJxOALcgcv1nrS3NqhE","name":"20261114_213058.140.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1q4fG22ol-XrzpmJxOALcgcv1nrS3NqhE=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1q4fG22ol-XrzpmJxOALcgcv1nrS3NqhE=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1q4fG22ol-XrzpmJxOALcgcv1nrS3NqhE=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1q4fG22ol-XrzpmJxOALcgcv1nrS3NqhE=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1QxaHY-vBscGg7e_-rUwv2nhAbb_3-OZQ","name":"20261114_213105.982.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1QxaHY-vBscGg7e_-rUwv2nhAbb_3-OZQ=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1QxaHY-vBscGg7e_-rUwv2nhAbb_3-OZQ=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1QxaHY-vBscGg7e_-rUwv2nhAbb_3-OZQ=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1QxaHY-vBscGg7e_-rUwv2nhAbb_3-OZQ=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1ZXWLGHdOw29x9fqmcpXyDzdnbo3EzU9p","name":"20261114_213106.561.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1ZXWLGHdOw29x9fqmcpXyDzdnbo3EzU9p=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1ZXWLGHdOw29x9fqmcpXyDzdnbo3EzU9p=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1ZXWLGHdOw29x9fqmcpXyDzdnbo3EzU9p=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1ZXWLGHdOw29x9fqmcpXyDzdnbo3EzU9p=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1oxYgXFim67DkcSb-k2TgeIqT41uoN06C","name":"20261114_213443.488.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1oxYgXFim67DkcSb-k2TgeIqT41uoN06C=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1oxYgXFim67DkcSb-k2TgeIqT41uoN06C=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1oxYgXFim67DkcSb-k2TgeIqT41uoN06C=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1oxYgXFim67DkcSb-k2TgeIqT41uoN06C=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"12o8EaqzuykohHYUIt0692X4hg0x37l7F","name":"20261114_213444.056.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/12o8EaqzuykohHYUIt0692X4hg0x37l7F=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/12o8EaqzuykohHYUIt0692X4hg0x37l7F=w3200","highResUrl":"https://lh3.googleusercontent.com/d/12o8EaqzuykohHYUIt0692X4hg0x37l7F=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/12o8EaqzuykohHYUIt0692X4hg0x37l7F=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1iHS4ajbROj5uN-jTisT_EgeeSzl4abae","name":"20261114_213607.393.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1iHS4ajbROj5uN-jTisT_EgeeSzl4abae=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1iHS4ajbROj5uN-jTisT_EgeeSzl4abae=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1iHS4ajbROj5uN-jTisT_EgeeSzl4abae=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1iHS4ajbROj5uN-jTisT_EgeeSzl4abae=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1kPfpIi1Hdi5MFA9c8DkNj9G2fFShhj3K","name":"20261114_213608.006.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1kPfpIi1Hdi5MFA9c8DkNj9G2fFShhj3K=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1kPfpIi1Hdi5MFA9c8DkNj9G2fFShhj3K=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1kPfpIi1Hdi5MFA9c8DkNj9G2fFShhj3K=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1kPfpIi1Hdi5MFA9c8DkNj9G2fFShhj3K=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1QfdJkipTwCao0FIvGpUM_C_h9K72GCG_","name":"20261114_213918.023.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1QfdJkipTwCao0FIvGpUM_C_h9K72GCG_=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1QfdJkipTwCao0FIvGpUM_C_h9K72GCG_=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1QfdJkipTwCao0FIvGpUM_C_h9K72GCG_=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1QfdJkipTwCao0FIvGpUM_C_h9K72GCG_=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1bvh3g3enyjdLzlRRISRGSf_6ajETHW2l","name":"20261114_213918.434.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1bvh3g3enyjdLzlRRISRGSf_6ajETHW2l=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1bvh3g3enyjdLzlRRISRGSf_6ajETHW2l=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1bvh3g3enyjdLzlRRISRGSf_6ajETHW2l=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1bvh3g3enyjdLzlRRISRGSf_6ajETHW2l=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1hg5CZsDalZnZQKOC4A8g5jy3b9LvSSRA","name":"20261114_213918.434.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1hg5CZsDalZnZQKOC4A8g5jy3b9LvSSRA=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1hg5CZsDalZnZQKOC4A8g5jy3b9LvSSRA=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1hg5CZsDalZnZQKOC4A8g5jy3b9LvSSRA=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1hg5CZsDalZnZQKOC4A8g5jy3b9LvSSRA=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1gvSL3aeHfVqqEdJ3rdTpMoWido5xhuMn","name":"20261114_213918.855.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1gvSL3aeHfVqqEdJ3rdTpMoWido5xhuMn=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1gvSL3aeHfVqqEdJ3rdTpMoWido5xhuMn=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1gvSL3aeHfVqqEdJ3rdTpMoWido5xhuMn=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1gvSL3aeHfVqqEdJ3rdTpMoWido5xhuMn=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"13nmMXi0LAhG7aVZ_wF1SPM2VOqa2vj7F","name":"20261114_214051.257.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/13nmMXi0LAhG7aVZ_wF1SPM2VOqa2vj7F=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/13nmMXi0LAhG7aVZ_wF1SPM2VOqa2vj7F=w3200","highResUrl":"https://lh3.googleusercontent.com/d/13nmMXi0LAhG7aVZ_wF1SPM2VOqa2vj7F=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/13nmMXi0LAhG7aVZ_wF1SPM2VOqa2vj7F=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1TCac4JTCwKG4HsR5cUhYPqSxl6vFDqLx","name":"20261114_214052.195.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1TCac4JTCwKG4HsR5cUhYPqSxl6vFDqLx=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1TCac4JTCwKG4HsR5cUhYPqSxl6vFDqLx=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1TCac4JTCwKG4HsR5cUhYPqSxl6vFDqLx=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1TCac4JTCwKG4HsR5cUhYPqSxl6vFDqLx=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1Okk4sgHnF0QfE5XRxef5CNJuv5kUfdsj","name":"20261114_214055.849.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1Okk4sgHnF0QfE5XRxef5CNJuv5kUfdsj=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1Okk4sgHnF0QfE5XRxef5CNJuv5kUfdsj=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1Okk4sgHnF0QfE5XRxef5CNJuv5kUfdsj=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1Okk4sgHnF0QfE5XRxef5CNJuv5kUfdsj=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1q_fzGcRzb87Ff_n6XRfVolL6OWzihBsh","name":"20261114_214057.171.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1q_fzGcRzb87Ff_n6XRfVolL6OWzihBsh=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1q_fzGcRzb87Ff_n6XRfVolL6OWzihBsh=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1q_fzGcRzb87Ff_n6XRfVolL6OWzihBsh=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1q_fzGcRzb87Ff_n6XRfVolL6OWzihBsh=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1a0Djb8SZ8AJSLw4FruWDXqYgFCjSNb9S","name":"20261114_214101.442.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1a0Djb8SZ8AJSLw4FruWDXqYgFCjSNb9S=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1a0Djb8SZ8AJSLw4FruWDXqYgFCjSNb9S=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1a0Djb8SZ8AJSLw4FruWDXqYgFCjSNb9S=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1a0Djb8SZ8AJSLw4FruWDXqYgFCjSNb9S=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1WRezC3WQ3ITsg2uTZmFeoEtQbLn5wLq6","name":"20261114_214101.978.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1WRezC3WQ3ITsg2uTZmFeoEtQbLn5wLq6=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1WRezC3WQ3ITsg2uTZmFeoEtQbLn5wLq6=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1WRezC3WQ3ITsg2uTZmFeoEtQbLn5wLq6=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1WRezC3WQ3ITsg2uTZmFeoEtQbLn5wLq6=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1jrvbCrOQPIZqIzaLslNPmqy0UWly7nX7","name":"20261114_214244.205.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1jrvbCrOQPIZqIzaLslNPmqy0UWly7nX7=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1jrvbCrOQPIZqIzaLslNPmqy0UWly7nX7=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1jrvbCrOQPIZqIzaLslNPmqy0UWly7nX7=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1jrvbCrOQPIZqIzaLslNPmqy0UWly7nX7=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1WWkE2S5HMQ8VVuGo2eV6B0ikgh1Tc6EO","name":"20261114_214244.946.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1WWkE2S5HMQ8VVuGo2eV6B0ikgh1Tc6EO=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1WWkE2S5HMQ8VVuGo2eV6B0ikgh1Tc6EO=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1WWkE2S5HMQ8VVuGo2eV6B0ikgh1Tc6EO=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1WWkE2S5HMQ8VVuGo2eV6B0ikgh1Tc6EO=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1bT2wDYljihmkAg3J_5BgR6JRWKYBHJjc","name":"20261114_214250.500.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1bT2wDYljihmkAg3J_5BgR6JRWKYBHJjc=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1bT2wDYljihmkAg3J_5BgR6JRWKYBHJjc=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1bT2wDYljihmkAg3J_5BgR6JRWKYBHJjc=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1bT2wDYljihmkAg3J_5BgR6JRWKYBHJjc=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1qi9HQPhSVW3uRP906GCNaewXbGm4w_QX","name":"20261114_214251.148.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1qi9HQPhSVW3uRP906GCNaewXbGm4w_QX=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1qi9HQPhSVW3uRP906GCNaewXbGm4w_QX=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1qi9HQPhSVW3uRP906GCNaewXbGm4w_QX=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1qi9HQPhSVW3uRP906GCNaewXbGm4w_QX=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1aqd2irNtDObUln9fAY92TQEcRAzfF9I2","name":"20261114_214452.391.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1aqd2irNtDObUln9fAY92TQEcRAzfF9I2=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1aqd2irNtDObUln9fAY92TQEcRAzfF9I2=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1aqd2irNtDObUln9fAY92TQEcRAzfF9I2=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1aqd2irNtDObUln9fAY92TQEcRAzfF9I2=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1xrOQbRIbHydOzL33VVXP6zWJfrN_hXWk","name":"20261114_214453.861.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1xrOQbRIbHydOzL33VVXP6zWJfrN_hXWk=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1xrOQbRIbHydOzL33VVXP6zWJfrN_hXWk=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1xrOQbRIbHydOzL33VVXP6zWJfrN_hXWk=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1xrOQbRIbHydOzL33VVXP6zWJfrN_hXWk=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"19c5jQvEKv_E5rmLAOdTCTTiGLB5JNFcb","name":"20261114_214504.183.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/19c5jQvEKv_E5rmLAOdTCTTiGLB5JNFcb=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/19c5jQvEKv_E5rmLAOdTCTTiGLB5JNFcb=w3200","highResUrl":"https://lh3.googleusercontent.com/d/19c5jQvEKv_E5rmLAOdTCTTiGLB5JNFcb=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/19c5jQvEKv_E5rmLAOdTCTTiGLB5JNFcb=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1JAo65aXrFBQC9iLwj2rtN4HE5Ugkj2Lu","name":"20261114_214626.297.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1JAo65aXrFBQC9iLwj2rtN4HE5Ugkj2Lu=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1JAo65aXrFBQC9iLwj2rtN4HE5Ugkj2Lu=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1JAo65aXrFBQC9iLwj2rtN4HE5Ugkj2Lu=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1JAo65aXrFBQC9iLwj2rtN4HE5Ugkj2Lu=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1tSpVbYoBmImIFqPe0BZZ_Rc5NB91Vq_A","name":"20261114_214627.522.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1tSpVbYoBmImIFqPe0BZZ_Rc5NB91Vq_A=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1tSpVbYoBmImIFqPe0BZZ_Rc5NB91Vq_A=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1tSpVbYoBmImIFqPe0BZZ_Rc5NB91Vq_A=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1tSpVbYoBmImIFqPe0BZZ_Rc5NB91Vq_A=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1TomNwFo1zvJh8CuxC9e-Mm0gpPUPr1Rg","name":"20261114_214628.232.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1TomNwFo1zvJh8CuxC9e-Mm0gpPUPr1Rg=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1TomNwFo1zvJh8CuxC9e-Mm0gpPUPr1Rg=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1TomNwFo1zvJh8CuxC9e-Mm0gpPUPr1Rg=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1TomNwFo1zvJh8CuxC9e-Mm0gpPUPr1Rg=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"19Jtq_Xm_7kpqkW8gJ4XMQ3zd72QPeApI","name":"20261114_214647.695.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/19Jtq_Xm_7kpqkW8gJ4XMQ3zd72QPeApI=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/19Jtq_Xm_7kpqkW8gJ4XMQ3zd72QPeApI=w3200","highResUrl":"https://lh3.googleusercontent.com/d/19Jtq_Xm_7kpqkW8gJ4XMQ3zd72QPeApI=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/19Jtq_Xm_7kpqkW8gJ4XMQ3zd72QPeApI=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1LLiNpIO-1hW7m9HpKrmF7fkCFe7BB0b1","name":"20261114_214803.359.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1LLiNpIO-1hW7m9HpKrmF7fkCFe7BB0b1=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1LLiNpIO-1hW7m9HpKrmF7fkCFe7BB0b1=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1LLiNpIO-1hW7m9HpKrmF7fkCFe7BB0b1=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1LLiNpIO-1hW7m9HpKrmF7fkCFe7BB0b1=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1JKmsqqYpdbwGafLOZwFDo6_kHU2QRGT5","name":"20261114_214803.875.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1JKmsqqYpdbwGafLOZwFDo6_kHU2QRGT5=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1JKmsqqYpdbwGafLOZwFDo6_kHU2QRGT5=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1JKmsqqYpdbwGafLOZwFDo6_kHU2QRGT5=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1JKmsqqYpdbwGafLOZwFDo6_kHU2QRGT5=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1K8UyNsS0ApxmytnJ4lq-pFyNclL1maeg","name":"20261114_214804.418.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1K8UyNsS0ApxmytnJ4lq-pFyNclL1maeg=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1K8UyNsS0ApxmytnJ4lq-pFyNclL1maeg=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1K8UyNsS0ApxmytnJ4lq-pFyNclL1maeg=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1K8UyNsS0ApxmytnJ4lq-pFyNclL1maeg=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"15x_sa815istVIdK2FAvp9hfjUDMALjZ9","name":"20261114_215053.054.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/15x_sa815istVIdK2FAvp9hfjUDMALjZ9=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/15x_sa815istVIdK2FAvp9hfjUDMALjZ9=w3200","highResUrl":"https://lh3.googleusercontent.com/d/15x_sa815istVIdK2FAvp9hfjUDMALjZ9=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/15x_sa815istVIdK2FAvp9hfjUDMALjZ9=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1pGPPc3xB67lI4BOMZgQ42KhYtRGB8rra","name":"20261114_215053.439.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1pGPPc3xB67lI4BOMZgQ42KhYtRGB8rra=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1pGPPc3xB67lI4BOMZgQ42KhYtRGB8rra=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1pGPPc3xB67lI4BOMZgQ42KhYtRGB8rra=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1pGPPc3xB67lI4BOMZgQ42KhYtRGB8rra=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1r9Y2MDnGclQm8uMnC0IiJc-T0Gehcvhj","name":"20261114_215053.824.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1r9Y2MDnGclQm8uMnC0IiJc-T0Gehcvhj=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1r9Y2MDnGclQm8uMnC0IiJc-T0Gehcvhj=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1r9Y2MDnGclQm8uMnC0IiJc-T0Gehcvhj=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1r9Y2MDnGclQm8uMnC0IiJc-T0Gehcvhj=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"18kYcUPF94Ahj6FNbgwMCZBCXNFis32xI","name":"20261114_215305.224.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/18kYcUPF94Ahj6FNbgwMCZBCXNFis32xI=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/18kYcUPF94Ahj6FNbgwMCZBCXNFis32xI=w3200","highResUrl":"https://lh3.googleusercontent.com/d/18kYcUPF94Ahj6FNbgwMCZBCXNFis32xI=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/18kYcUPF94Ahj6FNbgwMCZBCXNFis32xI=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1Uzi5bjQP6KFVbTJuPxKCWE6Zg5WPJ-BF","name":"20261114_215306.085.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1Uzi5bjQP6KFVbTJuPxKCWE6Zg5WPJ-BF=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1Uzi5bjQP6KFVbTJuPxKCWE6Zg5WPJ-BF=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1Uzi5bjQP6KFVbTJuPxKCWE6Zg5WPJ-BF=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1Uzi5bjQP6KFVbTJuPxKCWE6Zg5WPJ-BF=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1Nn1dp8HH7lALxUpddN7ynm2wix_RFZIi","name":"20261114_215306.587.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1Nn1dp8HH7lALxUpddN7ynm2wix_RFZIi=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1Nn1dp8HH7lALxUpddN7ynm2wix_RFZIi=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1Nn1dp8HH7lALxUpddN7ynm2wix_RFZIi=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1Nn1dp8HH7lALxUpddN7ynm2wix_RFZIi=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1pguYne8WdcOIfuN2LQiKIsbmSEDyoAfC","name":"20261114_215310.824.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1pguYne8WdcOIfuN2LQiKIsbmSEDyoAfC=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1pguYne8WdcOIfuN2LQiKIsbmSEDyoAfC=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1pguYne8WdcOIfuN2LQiKIsbmSEDyoAfC=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1pguYne8WdcOIfuN2LQiKIsbmSEDyoAfC=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1AXHNpATBcgJ4fjVVwH3fnK2EtmsgAZZr","name":"20261114_215311.547.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1AXHNpATBcgJ4fjVVwH3fnK2EtmsgAZZr=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1AXHNpATBcgJ4fjVVwH3fnK2EtmsgAZZr=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1AXHNpATBcgJ4fjVVwH3fnK2EtmsgAZZr=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1AXHNpATBcgJ4fjVVwH3fnK2EtmsgAZZr=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1h9TDv92ecKqeJGf1Y9ufPtRgBqMKENWL","name":"20261114_215431.047.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1h9TDv92ecKqeJGf1Y9ufPtRgBqMKENWL=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1h9TDv92ecKqeJGf1Y9ufPtRgBqMKENWL=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1h9TDv92ecKqeJGf1Y9ufPtRgBqMKENWL=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1h9TDv92ecKqeJGf1Y9ufPtRgBqMKENWL=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1nKCtdgjBqPatu13I9gkhDVJ3NiEE3neP","name":"20261114_215431.708.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1nKCtdgjBqPatu13I9gkhDVJ3NiEE3neP=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1nKCtdgjBqPatu13I9gkhDVJ3NiEE3neP=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1nKCtdgjBqPatu13I9gkhDVJ3NiEE3neP=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1nKCtdgjBqPatu13I9gkhDVJ3NiEE3neP=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1gZBjIG5hGuXDxnaoZrXhWqq6IkOv_Qxa","name":"20261114_215440.098.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1gZBjIG5hGuXDxnaoZrXhWqq6IkOv_Qxa=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1gZBjIG5hGuXDxnaoZrXhWqq6IkOv_Qxa=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1gZBjIG5hGuXDxnaoZrXhWqq6IkOv_Qxa=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1gZBjIG5hGuXDxnaoZrXhWqq6IkOv_Qxa=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1oGNo2AhXOxjGfZup49mj7RSRzMT7_blM","name":"20261114_215440.543.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1oGNo2AhXOxjGfZup49mj7RSRzMT7_blM=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1oGNo2AhXOxjGfZup49mj7RSRzMT7_blM=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1oGNo2AhXOxjGfZup49mj7RSRzMT7_blM=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1oGNo2AhXOxjGfZup49mj7RSRzMT7_blM=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1nam0bdIoxL5vbydCDnE3jeL6MC-qAL-2","name":"20261114_215805.483.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1nam0bdIoxL5vbydCDnE3jeL6MC-qAL-2=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1nam0bdIoxL5vbydCDnE3jeL6MC-qAL-2=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1nam0bdIoxL5vbydCDnE3jeL6MC-qAL-2=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1nam0bdIoxL5vbydCDnE3jeL6MC-qAL-2=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"13YfHPZZhbFU4F6dO5K7G-ICGkk5gw_fZ","name":"20261114_215806.099.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/13YfHPZZhbFU4F6dO5K7G-ICGkk5gw_fZ=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/13YfHPZZhbFU4F6dO5K7G-ICGkk5gw_fZ=w3200","highResUrl":"https://lh3.googleusercontent.com/d/13YfHPZZhbFU4F6dO5K7G-ICGkk5gw_fZ=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/13YfHPZZhbFU4F6dO5K7G-ICGkk5gw_fZ=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1Cro7uzz2A9QjEWAttOlVpbVvfbqa8qCy","name":"20261114_215811.263.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1Cro7uzz2A9QjEWAttOlVpbVvfbqa8qCy=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1Cro7uzz2A9QjEWAttOlVpbVvfbqa8qCy=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1Cro7uzz2A9QjEWAttOlVpbVvfbqa8qCy=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1Cro7uzz2A9QjEWAttOlVpbVvfbqa8qCy=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1oqVJ4jt5n_tlDxqC8eYGGgkE-dHpVmpI","name":"20261114_215811.944.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1oqVJ4jt5n_tlDxqC8eYGGgkE-dHpVmpI=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1oqVJ4jt5n_tlDxqC8eYGGgkE-dHpVmpI=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1oqVJ4jt5n_tlDxqC8eYGGgkE-dHpVmpI=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1oqVJ4jt5n_tlDxqC8eYGGgkE-dHpVmpI=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1CZa7HWH4bywwLPsaMGWzb4f0YGt30kEo","name":"20261114_220000.378.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1CZa7HWH4bywwLPsaMGWzb4f0YGt30kEo=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1CZa7HWH4bywwLPsaMGWzb4f0YGt30kEo=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1CZa7HWH4bywwLPsaMGWzb4f0YGt30kEo=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1CZa7HWH4bywwLPsaMGWzb4f0YGt30kEo=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"110zo8SDnONOZnZJgwQvbY3lL_3WOuQn9","name":"20261114_220000.875.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/110zo8SDnONOZnZJgwQvbY3lL_3WOuQn9=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/110zo8SDnONOZnZJgwQvbY3lL_3WOuQn9=w3200","highResUrl":"https://lh3.googleusercontent.com/d/110zo8SDnONOZnZJgwQvbY3lL_3WOuQn9=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/110zo8SDnONOZnZJgwQvbY3lL_3WOuQn9=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1O_6TUKQCo_huNd-VhLJ3sOdqsZQ0YYGL","name":"20261114_220001.398.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1O_6TUKQCo_huNd-VhLJ3sOdqsZQ0YYGL=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1O_6TUKQCo_huNd-VhLJ3sOdqsZQ0YYGL=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1O_6TUKQCo_huNd-VhLJ3sOdqsZQ0YYGL=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1O_6TUKQCo_huNd-VhLJ3sOdqsZQ0YYGL=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1y4NOMiU-p-BYOWu7ugbxBt8zyFUpovck","name":"20261114_220008.616.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1y4NOMiU-p-BYOWu7ugbxBt8zyFUpovck=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1y4NOMiU-p-BYOWu7ugbxBt8zyFUpovck=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1y4NOMiU-p-BYOWu7ugbxBt8zyFUpovck=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1y4NOMiU-p-BYOWu7ugbxBt8zyFUpovck=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"1otJhw25KcrR09yQ2bjlnliooCe0MC-ru","name":"20261114_220009.190.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/1otJhw25KcrR09yQ2bjlnliooCe0MC-ru=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/1otJhw25KcrR09yQ2bjlnliooCe0MC-ru=w3200","highResUrl":"https://lh3.googleusercontent.com/d/1otJhw25KcrR09yQ2bjlnliooCe0MC-ru=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/1otJhw25KcrR09yQ2bjlnliooCe0MC-ru=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false},{"id":"17p1aNzjuxUDomQLscPi-GYcZOObJi0_M","name":"20261114_220009.671.jpg","category":"Wedding","thumbnailUrl":"https://lh3.googleusercontent.com/d/17p1aNzjuxUDomQLscPi-GYcZOObJi0_M=w600-h600","previewUrl":"https://lh3.googleusercontent.com/d/17p1aNzjuxUDomQLscPi-GYcZOObJi0_M=w3200","highResUrl":"https://lh3.googleusercontent.com/d/17p1aNzjuxUDomQLscPi-GYcZOObJi0_M=w3200","downloadUrl":"https://lh3.googleusercontent.com/d/17p1aNzjuxUDomQLscPi-GYcZOObJi0_M=w3200","customFolderId":"1GGB77clCMYBIg17J0ECr2eVbD02ZeInW","isVideo":false}];
    const GLOBAL_CONFIG = {
      GAS_API_URL: "https://script.google.com/macros/s/AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l/exec",
      EVENT_NAME: "Wilson & Felicia",
      EVENT_DATE: "16 November 2026",
      EVENT_VENUE: "UpperHills Convention Hall, Makassar",
      SUBTITLE: "The Wedding Gallery & Precious Memories",
      WELCOME_MESSAGE: "Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.",
      FOOTER_MESSAGE: "Diabadikan dengan cinta\nTerima kasih atas doa restunya.",
      ALL_PHOTOS_LABEL: "Semua Foto",
      ACTIVE_EVENT_ID: "wilson-felicia",
      EVENTS: [
        {
          id: "wilson-felicia",
          name: "Wilson & Felicia",
          date: "14 November 2026",
          venue: "Upperhills Convention Centre, Makassar",
          subtitle: "The Wedding Gallery & Precious Memories",
          welcomeMessage: "Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.",
          footerMessage: "Diabadikan dengan cinta\nTerima kasih atas doa restunya.",
          allPhotosLabel: "Semua Foto",
          driveFolderId: "1AhdkSch9C-F2FvYKd_IO2O7RSsRDJxI5",
          frameImageUrl: "https://drive.google.com/file/d/11u-XHGv13oljACPnwSfTIS65NEIeRNa-/view?usp=sharing",
          customCategories: [
            { name: "Photobooth", url: "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs" }
          ],
          coverSettings: {
            enabled: false,
            style: "romantic-collage",
            heading: "The Wedding Celebration",
            subheading: "A Journey of Two Hearts Joined as One",
            quote: "Di setiap langkah dan senyuman, terukir kisah cinta abadi yang kami rayakan bersama Anda.",
            photos: []
          }
        }
      ],
      ADMIN_ACCOUNTS: [
        { id: "usr_superadmin", username: "admin", password: "123", name: "Super Admin", role: "Super Admin" }
      ],
      CUSTOM_CATEGORIES: [
        {
                "name": "Photobooth",
                "url": "https://photos.google.com/share/AF1QipMagPm7xWB2YANajDr3hx-J4WKyhOgIQ41jUjqQnxv5LSy6392pyWC5hOfsQoz1mA?key=c1BLMDNyRGw4bEJyUWo5b1Y0eFlmTy14X1pESEdR",
                "enabled": true
        },
        {
                "name": "Wedding",
                "url": "https://drive.google.com/drive/folders/1GGB77clCMYBIg17J0ECr2eVbD02ZeInW",
                "enabled": true
        }
],
      DRIVE_FOLDER_ID: "1AhdkSch9C-F2FvYKd_IO2O7RSsRDJxI5",
      FRAME_IMAGE_URL: "https://drive.google.com/file/d/11u-XHGv13oljACPnwSfTIS65NEIeRNa-/view?usp=sharing",
      SPREADSHEET_ID: "133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20",
      SPREADSHEET_URL: "https://docs.google.com/spreadsheets/d/133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20/edit",
      DEFAULT_ADMIN_PIN: "123456",
      NEW_BADGE_MINUTES: 10
    };

    const state = {
      allPhotos: [],
      filteredPhotos: [],
      categories: ["Semua Foto"],
      allPhotosLabel: "Semua Foto",
      currentEventId: "wilson-felicia",
      events: [],
      coverSettings: {
        enabled: true,
        style: "romantic-collage",
        heading: "The Wedding Celebration",
        subheading: "A Journey of Two Hearts Joined as One",
        quote: "Di setiap langkah dan senyuman, terukir kisah cinta abadi yang kami rayakan bersama Anda.",
        photos: []
      },
      customCategories: [
        { name: "Photobooth", url: "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs" }
      ],
      adminAccounts: [
        { id: "usr_superadmin", username: "admin", password: "123", name: "Super Admin", role: "Super Admin" }
      ],
      failedPhotoIds: new Set(),
      activeCategory: "Semua Foto",
      categoryPhotosMap: {},
      currentLightboxIndex: 0,
      currentSlideIndex: 0,
      slideshowTimer: null,
      slideshowProgressTimer: null,
      isSlideshowPlaying: true,
      activeSlideTarget: 'A',
      intervalMs: 4000,
      
      isAdminLoggedIn: false,
      adminPin: "123",
      currentAdminUser: { username: "admin", name: "Super Admin", role: "Super Admin" },
      activeConfig: Object.assign({}, GLOBAL_CONFIG),
      gasApiUrl: "",
      newBadgeDurationMs: (GLOBAL_CONFIG.NEW_BADGE_MINUTES || 10) * 60 * 1000,
      autoRefreshTimer: null,
      autoRefreshIntervalMs: 20000,
      isAutoRefreshing: false
    };

    function getActiveEventIdFromUrl() {
      try {
        const params = new URLSearchParams(window.location.search);
        return params.get("event") || params.get("e") || "";
      } catch (e) {
        return "";
      }
    }

    function isPhotoNew(photo) {
      if (!photo) return false;
      if (photo.isNewlyAdded) return true;
      const ts = photo.timestamp || photo.detectedAt;
      if (!ts) return false;
      return (Date.now() - ts) < state.newBadgeDurationMs;
    }

    function startBadgeExpiryChecker() {
      setInterval(function() {
        const now = Date.now();
        const badges = document.querySelectorAll(".photo-badge-new");
        badges.forEach(function(badge) {
          const ts = parseInt(badge.getAttribute("data-timestamp"), 10);
          if (ts && (now - ts > state.newBadgeDurationMs)) {
            badge.classList.add("fade-out");
            setTimeout(function() {
              badge.remove();
            }, 800);
          }
        });
      }, 20000);
    }

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    document.addEventListener("DOMContentLoaded", function() {
      setupTouchSwipe();

      // Pre-seed categoryPhotosMap agar saat refresh counter tidak kosong & foto langsung siap instan
      if (!state.categoryPhotosMap) state.categoryPhotosMap = {};
      if (typeof WEDDING_INITIAL_CACHE !== 'undefined' && Array.isArray(WEDDING_INITIAL_CACHE) && WEDDING_INITIAL_CACHE.length > 0) {
        state.categoryPhotosMap["Wedding"] = WEDDING_INITIAL_CACHE;
      }
      if (typeof KING_PHOTOBOOTH_INITIAL_CACHE !== 'undefined' && Array.isArray(KING_PHOTOBOOTH_INITIAL_CACHE) && KING_PHOTOBOOTH_INITIAL_CACHE.length > 0) {
        state.categoryPhotosMap["Photobooth"] = buildKingPhotoList(KING_PHOTOBOOTH_INITIAL_CACHE, "Photobooth", "https://x1.kingphotobooth.co/e/23d0e80056ae8f2fbb5d116f");
      }
      setupKeyboardNav();

      // 1. Muat URL API backend yang tersimpan
      const savedApiUrl = localStorage.getItem("WEDDING_GAS_API_URL") || GLOBAL_CONFIG.GAS_API_URL;
      if (savedApiUrl) {
        state.gasApiUrl = savedApiUrl;
        const apiUrlInput = document.getElementById("cfgGasApiUrl");
        if (apiUrlInput) apiUrlInput.value = savedApiUrl;
      }

      // 2. Deteksi Parameter URL Event & Muat Cache Terisolasi (Anti-Flicker Lintas Event)
      const urlEventId = getActiveEventIdFromUrl();
      if (urlEventId) {
        state.currentEventId = urlEventId;
      }

      try {
        const cacheKey = state.currentEventId ? ("WEDDING_EVENT_CFG_" + state.currentEventId) : "WEDDING_ACTIVE_EVENT_CFG";
        let savedCfgStr = localStorage.getItem(cacheKey);
        if (!savedCfgStr && !urlEventId) {
          savedCfgStr = localStorage.getItem("WEDDING_SAVED_CONFIG");
        }
        if (savedCfgStr) {
          const savedCfg = JSON.parse(savedCfgStr);
          if (savedCfg.EVENT_NAME === "Hans & Yurike" || savedCfg.COUPLE_NAME === "Hans & Yurike") {
            delete savedCfg.EVENT_NAME;
            delete savedCfg.COUPLE_NAME;
          }
          state.activeConfig = Object.assign({}, GLOBAL_CONFIG, savedCfg);
          populateConfigToUI(state.activeConfig);
        } else {
          populateConfigToUI(GLOBAL_CONFIG);
        }
      } catch (e) {}

      // 3. Muat konfigurasi sentral dari config.json (Prioritas Multi-Event & Sinkronisasi Lintas Device)
      fetch("config.json?v=" + Date.now())
        .then(function(res) {
          if (!res.ok) throw new Error("No config.json");
          return res.json();
        })
        .then(function(remoteCfg) {
          if (remoteCfg && typeof remoteCfg === "object") {
            if (remoteCfg.GAS_API_URL) {
              state.gasApiUrl = remoteCfg.GAS_API_URL;
              const apiUrlInput = document.getElementById("cfgGasApiUrl");
              if (apiUrlInput) apiUrlInput.value = remoteCfg.GAS_API_URL;
            }
            if (Array.isArray(remoteCfg.EVENTS)) {
              state.events = remoteCfg.EVENTS;
              const matchedEv = state.events.find(function(ev) { return ev.id === state.currentEventId; });
              if (matchedEv) {
                remoteCfg.EVENT_NAME = matchedEv.name;
                remoteCfg.COUPLE_NAME = matchedEv.name;
                remoteCfg.EVENT_DATE = matchedEv.date;
                remoteCfg.EVENT_VENUE = matchedEv.venue;
                remoteCfg.SUBTITLE = matchedEv.subtitle;
                remoteCfg.WELCOME_MESSAGE = matchedEv.welcomeMessage;
                remoteCfg.FOOTER_MESSAGE = matchedEv.footerMessage;
                remoteCfg.ALL_PHOTOS_LABEL = matchedEv.allPhotosLabel || "Semua Foto";
                remoteCfg.DRIVE_FOLDER_ID = matchedEv.driveFolderId;
                remoteCfg.FRAME_IMAGE_URL = matchedEv.frameImageUrl;
                remoteCfg.CUSTOM_CATEGORIES = matchedEv.customCategories || [];
                remoteCfg.COVER_SETTINGS = matchedEv.coverSettings;
              }
            }
            if (remoteCfg.ADMIN_ACCOUNTS) {
              state.adminAccounts = remoteCfg.ADMIN_ACCOUNTS;
            }
            state.activeConfig = Object.assign({}, GLOBAL_CONFIG, remoteCfg);
            populateConfigToUI(state.activeConfig);
          }
        })
        .catch(function() {})
        .finally(function() {
          // 4. Fail-Safe: Jika URL belum terdeteksi, baca baris Pengaturan di Google Spreadsheet publik via GViz
          syncFromSpreadsheetGViz(function() {
            // 5. Ambil data galeri & konfigurasi live dari Google Apps Script untuk event aktif
            fetchGalleryData(false, false);
            startLiveAutoRefresh();
            startBadgeExpiryChecker();
          });
        });
    });

    function syncFromSpreadsheetGViz(callback) {
      const sid = state.activeConfig.SPREADSHEET_ID || GLOBAL_CONFIG.SPREADSHEET_ID || "133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20";
      if (!sid) { if (callback) callback(); return; }
      fetch("https://docs.google.com/spreadsheets/d/" + sid + "/gviz/tq?tqx=out:json&sheet=Pengaturan&t=" + Date.now())
        .then(function(r) { return r.text(); })
        .then(function(t) {
          const raw = t.replace(/^\/\*.*?\*\/\s*google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, '');
          const parsed = JSON.parse(raw);
          if (parsed && parsed.table && parsed.table.rows) {
            const sheetMap = {};
            parsed.table.rows.forEach(function(row) {
              const k = row.c && row.c[0] ? String(row.c[0].v || '').trim() : '';
              const v = row.c && row.c[1] ? String(row.c[1].v || '').trim() : '';
              if (k) sheetMap[k] = v;
            });

            // Sinkronkan kategori dari Google Spreadsheet Database ke seluruh device
            if (sheetMap.CUSTOM_CATEGORIES && !sheetMap.CUSTOM_CATEGORIES.includes("[object Object]")) {
              try {
                const parsedCats = JSON.parse(sheetMap.CUSTOM_CATEGORIES);
                if (Array.isArray(parsedCats) && parsedCats.length > 0) {
                  state.customCategories = parsedCats;
                  state.activeConfig.CUSTOM_CATEGORIES = parsedCats;
                  localStorage.setItem("WEDDING_SAVED_CUSTOM_CATEGORIES", JSON.stringify(parsedCats));

                  parsedCats.forEach(function(c) {
                    const cName = String((c && c.name) || c || "").trim();
                    const cUrl = String((c && c.url) || "").trim();
                    if (cName && cUrl) {
                      prefetchCategoryPhotos(cName, cUrl);
                    }
                  });
                }
              } catch(eCats) {}
            }

            if (sheetMap.ADMIN_USERNAME) {
              state.activeConfig.ADMIN_USERNAME = sheetMap.ADMIN_USERNAME;
              state.adminUsername = sheetMap.ADMIN_USERNAME;
            }
            if (sheetMap.ADMIN_PIN) {
              state.activeConfig.ADMIN_PIN = sheetMap.ADMIN_PIN;
              state.adminPin = sheetMap.ADMIN_PIN;
            }
            if (sheetMap.EVENT_DATE) state.activeConfig.EVENT_DATE = sheetMap.EVENT_DATE;
            if (sheetMap.EVENT_VENUE) state.activeConfig.EVENT_VENUE = sheetMap.EVENT_VENUE;
            if (sheetMap.EVENT_NAME || sheetMap.COUPLE_NAME) {
              state.activeConfig.EVENT_NAME = sheetMap.EVENT_NAME || sheetMap.COUPLE_NAME;
              state.activeConfig.COUPLE_NAME = state.activeConfig.EVENT_NAME;
            }
            if (sheetMap.DRIVE_FOLDER_ID) state.activeConfig.DRIVE_FOLDER_ID = sheetMap.DRIVE_FOLDER_ID;
            if (sheetMap.FRAME_IMAGE_URL) state.activeConfig.FRAME_IMAGE_URL = sheetMap.FRAME_IMAGE_URL;
            if (sheetMap.GAS_API_URL && sheetMap.GAS_API_URL.startsWith('http')) {
              state.gasApiUrl = sheetMap.GAS_API_URL;
            }
            if (sheetMap.ALL_PHOTOS_LABEL) state.allPhotosLabel = sheetMap.ALL_PHOTOS_LABEL;

            populateConfigToUI(state.activeConfig);
            renderCategoryTabs();
          }
        })
        .catch(function(err) {
          console.warn("GViz sync error:", err);
        })
        .finally(function() {
          if (callback) callback();
        });
    }

    function startLiveAutoRefresh() {
      if (state.autoRefreshTimer) clearInterval(state.autoRefreshTimer);
      state.autoRefreshTimer = setInterval(function() {
        syncFromSpreadsheetGViz(function() {
          if (!state.isAutoRefreshing) {
            fetchGalleryData(false, true);
          }
        });
      }, state.autoRefreshIntervalMs);
    }

    function callBackend(action, payload, onSuccess, onError) {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        if (action === "getGalleryData") {
          google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onError).getGalleryData();
        } else if (action === "adminLogin") {
          google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onError).adminLogin(payload.pin);
        } else if (action === "testAndSyncDriveFolder") {
          google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onError).testAndSyncDriveFolder(payload.pin, payload.folderId);
        } else if (action === "saveAdminSettings") {
          google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onError).saveAdminSettings(payload.pin, payload.config || payload);
        } else if (action === "setupDatabase" || action === "setupSpreadsheetDatabase") {
          google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onError).setupDatabaseSpreadsheet();
        } else if (action === "getAdminUsers") {
          google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onError).getAdminUsers(payload.pin);
        } else if (action === "addAdminUser") {
          google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onError).addAdminUser(payload.pin, payload.newUser);
        } else if (action === "deleteAdminUser") {
          google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onError).deleteAdminUser(payload.pin, payload.targetUserId);
        } else if (action === "getImageBase64") {
          google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onError).getImageBase64(payload.fileId);
        } else if (action === "changeAdminPin") {
          google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onError).changeAdminPin(payload.currentPin, payload.newPin);
        }
        return;
      }

      const apiUrl = state.gasApiUrl ? state.gasApiUrl.trim() : "";
      if (!apiUrl) {
        if (action === "getGalleryData") {
          loadFallbackData("URL API Backend belum dihubungkan");
        } else if (action === "adminLogin") {
          if (payload.pin === "123456" || payload.pin === "admin") {
            onSuccess({
              success: true,
              message: "Login demo lokal berhasil!",
              user: { id: "usr_superadmin", name: "Super Admin", role: "Super Admin" }
            });
          } else {
            onError({ message: "PIN yang Anda masukkan salah. Silakan coba lagi." });
          }
        } else if (action === "getAdminUsers") {
          onSuccess({
            success: true,
            users: [
              { id: "usr_superadmin", name: "Super Admin", role: "Super Admin", pinMasked: "••••" }
            ]
          });
        } else if (action === "addAdminUser") {
          onSuccess({
            success: true,
            message: "Pengguna " + payload.newUser.name + " berhasil ditambahkan (Demo Lokal)",
            users: [
              { id: "usr_superadmin", name: "Super Admin", role: "Super Admin", pinMasked: "••••" },
              { id: "usr_" + Date.now(), name: payload.newUser.name, role: payload.newUser.role || "Admin", pinMasked: "••••" }
            ]
          });
        } else if (action === "deleteAdminUser") {
          onSuccess({
            success: true,
            message: "Pengguna berhasil dihapus (Demo Lokal)",
            users: [
              { id: "usr_superadmin", name: "Super Admin", role: "Super Admin", pinMasked: "••••" }
            ]
          });
        } else if (action === "changeAdminPin") {
          if (payload.newPin && payload.newPin.length >= 4) {
            onSuccess({
              success: true,
              message: "PIN Admin berhasil diperbarui!"
            });
          } else {
            onError({ message: "PIN baru minimal 4 digit." });
          }
        } else {
          onSuccess({ success: true, message: "Aksi tersimulasi di Vercel." });
        }
        return;
      }

      const queryParams = new URLSearchParams({
        action: action,
        api: "true"
      });

      if (payload) {
        for (const key in payload) {
          if (typeof payload[key] === "object") {
            queryParams.append(key, JSON.stringify(payload[key]));
          } else {
            queryParams.append(key, String(payload[key]));
          }
        }
      }

      const requestUrl = apiUrl + (apiUrl.includes("?") ? "&" : "?") + queryParams.toString();

      fetch(requestUrl, {
        method: "GET",
        mode: "cors"
      })
      .then(function(res) {
        if (!res.ok) throw new Error("HTTP Status " + res.status);
        return res.json();
      })
      .then(function(data) {
        onSuccess(data);
      })
      .catch(function(err) {
        console.error("Gagal menghubungi Google Apps Script API:", err);
        onError(err);
      });
    }

    function fetchGalleryData(forceRefresh, isSilent) {
      const photosGrid = document.getElementById("photosGrid");
      state.isAutoRefreshing = true;

      if (!isSilent && (forceRefresh || state.allPhotos.length === 0)) {
        photosGrid.innerHTML = `
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
        `;
      }

      const refreshIcon = document.getElementById("refreshIconSvg");
      if (forceRefresh && refreshIcon) refreshIcon.classList.add("spin");

      callBackend("getGalleryData", { eventId: state.currentEventId }, function(response) {
        state.isAutoRefreshing = false;
        if (refreshIcon) refreshIcon.classList.remove("spin");
        handleGalleryResponse(response, isSilent);
        if (forceRefresh) showToast("Galeri foto berhasil diperbarui!");
      }, function(err) {
        state.isAutoRefreshing = false;
        if (refreshIcon) refreshIcon.classList.remove("spin");
        console.error("Gagal memuat galeri:", err);
        if (!isSilent) loadFallbackData("Gagal memuat data dari backend: " + err.message);
      });
    }

    function handleGalleryResponse(response, isSilent) {
      if (!response) return;

      const demoNotice = document.getElementById("demoNotice");
      if (demoNotice) demoNotice.style.display = "none";

      if (response.events && Array.isArray(response.events)) {
        state.events = response.events;
      }
      if (response.activeEventId) {
        state.currentEventId = response.activeEventId;
      }

      if (response.config) {
        state.activeConfig = response.config;
        if (response.config.ALL_PHOTOS_LABEL) {
          state.allPhotosLabel = response.config.ALL_PHOTOS_LABEL;
        }
        if (response.config.COVER_SETTINGS) {
          try {
            state.coverSettings = typeof response.config.COVER_SETTINGS === "string" 
              ? JSON.parse(response.config.COVER_SETTINGS) 
              : response.config.COVER_SETTINGS;
          } catch (eCov) {}
        }
        populateConfigToUI(response.config);

        // Simpan cache scoped per-event
        try {
          const cacheKey = state.currentEventId ? ("WEDDING_EVENT_CFG_" + state.currentEventId) : "WEDDING_ACTIVE_EVENT_CFG";
          localStorage.setItem(cacheKey, JSON.stringify(response.config));
        } catch (eSc) {}
      }

      // Filter ketat: Buang seluruh foto demo / sampel jika folder Google Drive kosong, serta foto yang tercatat rusak
      const incomingPhotos = (response.photos || []).filter(function(p) {
        if (!p || !p.id) return false;
        if (state.failedPhotoIds && state.failedPhotoIds.has(p.id)) return false;
        const sId = String(p.id).toLowerCase();
        if (sId.startsWith("demo-") || sId.startsWith("demo_") || /^d\d+$/.test(sId)) return false;
        if (p.thumbnailUrl && p.thumbnailUrl.includes("images.unsplash.com")) return false;
        return true;
      });

      if (incomingPhotos.length === 0) {
        state.allPhotos = [];
        state.categories = ["Semua Foto"];
        renderCategoryTabs();
        applyCategoryFilter("Semua Foto");
        return;
      }

      if (isSilent && state.allPhotos.length > 0) {
        const existingIds = new Set(state.allPhotos.map(function(p) { return p.id; }));
        // Hanya anggap foto baru jika ID belum pernah ada dan bukan foto yang tercatat error sebelumnya
        const newPhotos = incomingPhotos.filter(function(p) { 
          return !existingIds.has(p.id) && !(state.failedPhotoIds && state.failedPhotoIds.has(p.id)); 
        });

        if (newPhotos.length > 0) {
          const now = Date.now();
          newPhotos.forEach(function(p) {
            p.isNewlyAdded = true;
            p.detectedAt = now;
          });
          state.allPhotos = incomingPhotos;
          state.categories = response.categories || ["Semua Foto"];
          renderCategoryTabs();
          applyCategoryFilter(state.activeCategory);
          showToast("📸 " + newPhotos.length + " foto baru otomatis ditambahkan ke galeri!");
          return;
        }
      }

      state.allPhotos = incomingPhotos;
      state.categories = response.categories || ["Semua Foto"];
      
      renderCategoryTabs();
      applyCategoryFilter(state.activeCategory);
    }

    /* ==========================================================================
       DATE FORMATTING UTILITIES (INDONESIAN & DATE PICKER)
       ========================================================================== */
    const INDONESIAN_MONTHS = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    function formatIndonesianDate(dateStr) {
      if (!dateStr) return "14 November 2026";
      const s = String(dateStr).trim();
      if (/^\d{1,2}\s+[A-Za-z]+\s+\d{4}$/.test(s)) {
        return s;
      }
      const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const year = match[1];
        const monthIdx = parseInt(match[2], 10) - 1;
        const day = parseInt(match[3], 10);
        const monthName = INDONESIAN_MONTHS[monthIdx] || match[2];
        return day + " " + monthName + " " + year;
      }
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const day = d.getDate();
        const month = INDONESIAN_MONTHS[d.getMonth()];
        const year = d.getFullYear();
        return day + " " + month + " " + year;
      }
      return s;
    }

    function formatDateForInput(dateStr) {
      if (!dateStr) return "2026-11-14";
      const str = String(dateStr).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return str;
      }
      const parts = str.split(/\s+/);
      if (parts.length === 3) {
        const day = parts[0].padStart(2, "0");
        const monthName = parts[1].toLowerCase();
        const year = parts[2];
        const monthMap = {
          "januari": "01", "january": "01", "jan": "01",
          "februari": "02", "february": "02", "feb": "02",
          "maret": "03", "march": "03", "mar": "03",
          "april": "04", "apr": "04",
          "mei": "05", "may": "05",
          "juni": "06", "june": "06", "jun": "06",
          "juli": "07", "july": "07", "jul": "07",
          "agustus": "08", "august": "08", "agu": "08", "aug": "08",
          "september": "09", "sep": "09",
          "oktober": "10", "october": "10", "okt": "10", "oct": "10",
          "november": "11", "nov": "11",
          "desember": "12", "december": "12", "des": "12", "dec": "12"
        };
        if (monthMap[monthName] && /^\d{4}$/.test(year)) {
          return year + "-" + monthMap[monthName] + "-" + day;
        }
      }
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return yyyy + "-" + mm + "-" + dd;
      }
      return "2026-11-14";
    }

    function populateConfigToUI(cfg) {
      if (!cfg) return;
      const rawName = cfg.EVENT_NAME || cfg.COUPLE_NAME;
      const eventName = (rawName && rawName !== "Hans & Yurike") ? rawName : "Wilson & Felicia";
      const rawDate = cfg.EVENT_DATE || "14 November 2026";
      const displayDate = formatIndonesianDate(rawDate);
      const eventVenue = cfg.EVENT_VENUE || "Upperhills Convention Centre, Makassar";

      document.getElementById("coupleName").innerText = eventName;
      document.getElementById("slideshowCouple").innerText = eventName;
      document.querySelector(".footer-names").innerText = eventName;
      document.title = eventName + " - Wedding Photo Gallery";

      document.getElementById("eventDate").innerText = displayDate;
      document.getElementById("eventVenue").innerText = eventVenue;
      document.getElementById("slideshowCategory").innerText = displayDate + " • " + eventVenue;

      if (cfg.SUBTITLE) {
        document.getElementById("subtitle").innerText = cfg.SUBTITLE;
      }
      if (cfg.WELCOME_MESSAGE) {
        document.getElementById("welcomeMessage").innerText = cfg.WELCOME_MESSAGE;
      }
      if (cfg.FOOTER_MESSAGE) {
        const footerBlessingEl = document.getElementById("footerBlessing");
        if (footerBlessingEl) footerBlessingEl.textContent = cfg.FOOTER_MESSAGE;
      }
      // Prioritaskan Data Kategori Server / Config Sentral (Mencegah Ketidaksinkronan Antar-Device)
      let loadedCats = null;
      if (cfg.CUSTOM_CATEGORIES) {
        if (typeof cfg.CUSTOM_CATEGORIES === "string") {
          if (!cfg.CUSTOM_CATEGORIES.includes("[object Object]")) {
            try { loadedCats = JSON.parse(cfg.CUSTOM_CATEGORIES); } catch(e) {}
          }
        } else if (Array.isArray(cfg.CUSTOM_CATEGORIES)) {
          loadedCats = cfg.CUSTOM_CATEGORIES;
        }
      }
      if (!Array.isArray(loadedCats) || loadedCats.length === 0) {
        try {
          const savedCatsStr = localStorage.getItem("WEDDING_SAVED_CUSTOM_CATEGORIES");
          if (savedCatsStr) loadedCats = JSON.parse(savedCatsStr);
        } catch(e) {}
        if (!Array.isArray(loadedCats) || loadedCats.length === 0) {
          loadedCats = GLOBAL_CONFIG.CUSTOM_CATEGORIES || [];
        }
      }
      if (Array.isArray(loadedCats)) {
        state.customCategories = loadedCats.filter(function(c) {
          const cName = String((c && c.name) || c || "").trim();
          return cName && cName.toLowerCase() !== "teapai";
        });
      }

      if (cfg.ALL_PHOTOS_LABEL) {
        state.allPhotosLabel = String(cfg.ALL_PHOTOS_LABEL).trim() || "Semua Foto";
      }

      if (cfg.COVER_SETTINGS) {
        try {
          state.coverSettings = typeof cfg.COVER_SETTINGS === "string"
            ? JSON.parse(cfg.COVER_SETTINGS)
            : cfg.COVER_SETTINGS;
        } catch (eCov) {}
      }
      renderWeddingCoverShowcase();
      renderCategoryTabs();
      if (cfg.SLIDESHOW_INTERVAL_SEC) {
        state.intervalMs = cfg.SLIDESHOW_INTERVAL_SEC * 1000;
      }

      // Input form admin: HANYA perbarui jika modal admin SEDANG TIDAK DIBUKA (mencegah teks tertimpa saat admin mengetik)
      const adminModal = document.getElementById("adminSettingsModal");
      const isModalActive = adminModal && adminModal.classList.contains("active");

      if (!isModalActive) {
        const cfgFrameEl = document.getElementById("cfgFrameImageUrl");
        if (cfgFrameEl) cfgFrameEl.value = cfg.FRAME_IMAGE_URL || "";
        const cfgCoupleEl = document.getElementById("cfgCoupleName");
        if (cfgCoupleEl) cfgCoupleEl.value = eventName;
        const cfgDateEl = document.getElementById("cfgEventDate");
        if (cfgDateEl) cfgDateEl.value = formatDateForInput(rawDate);
        const cfgVenueEl = document.getElementById("cfgEventVenue");
        if (cfgVenueEl) cfgVenueEl.value = eventVenue;
        const cfgDriveEl = document.getElementById("cfgDriveFolderId");
        if (cfgDriveEl) cfgDriveEl.value = cfg.DRIVE_FOLDER_ID || "";
        const cfgSubEl = document.getElementById("cfgSubtitle");
        if (cfgSubEl) cfgSubEl.value = cfg.SUBTITLE || "";
        const cfgWelcomeEl = document.getElementById("cfgWelcomeMessage");
        if (cfgWelcomeEl) cfgWelcomeEl.value = cfg.WELCOME_MESSAGE || "";
        const cfgFooterEl = document.getElementById("cfgFooterMessage");
        if (cfgFooterEl) cfgFooterEl.value = cfg.FOOTER_MESSAGE || "Diabadikan dengan cinta\nTerima kasih atas doa restunya.";
        const cfgAllPhotosLabelEl = document.getElementById("cfgAllPhotosLabel");
        if (cfgAllPhotosLabelEl) cfgAllPhotosLabelEl.value = state.allPhotosLabel || "Semua Foto";

        renderAdminCoverManager();
        renderAdminEventsManager();
      }

      const frameBadge = document.getElementById("frameStatusBadge");
      if (frameBadge) {
        if (cfg.FRAME_IMAGE_URL) {
          frameBadge.innerText = "✓ Bingkai Aktif";
          frameBadge.style.color = "#10B981";
        } else {
          frameBadge.innerText = "Tanpa Bingkai";
          frameBadge.style.color = "#64748B";
        }
      }

      const apiBadge = document.getElementById("apiStatusBadge");
      if (apiBadge) {
        if (state.gasApiUrl) {
          apiBadge.innerText = "✓ Terhubung ke Apps Script";
          apiBadge.style.color = "#10B981";
        } else {
          apiBadge.innerText = "Mode Pratinjau Lokal";
          apiBadge.style.color = "#F59E0B";
        }
      }
    }

    function extractDriveFolderId(url) {
      if (!url) return null;
      const s = String(url).trim();
      const m = s.match(/folders\/([a-zA-Z0-9_\-]+)/);
      if (m && m[1]) return m[1];
      if (!s.startsWith("http") && s.length >= 25 && /^[a-zA-Z0-9_\-]+$/.test(s)) return s;
      return null;
    }

    function isExternalWebLink(url) {
      if (!url) return false;
      const s = String(url).trim().toLowerCase();
      if (!s.startsWith("http")) return false;
      if (s.includes("drive.google.com/drive/folders/")) return false;
      if (s.includes("drive.google.com/open?id=")) return false;
      return true;
    }

    function renderCategoryTabs() {
      const container = document.getElementById("categoryTabs");
      if (!container) return;
      container.innerHTML = "";

      const mainLabel = state.allPhotosLabel || "Semua Foto";
      const uniqueCategories = [];
      const seen = {};
      seen[mainLabel] = true;
      seen["Semua Foto"] = true;
      uniqueCategories.push(mainLabel);

      // 1. Kategori kustom dari admin / config (cek enabled flag)
      if (Array.isArray(state.customCategories)) {
        state.customCategories.forEach(function(item) {
          const catName = String((item && item.name) || item || "").trim();
          const isEnabled = (item && item.enabled !== undefined) ? item.enabled : true;
          if (catName && catName !== "Semua Foto" && isEnabled !== false && !seen[catName]) {
            seen[catName] = true;
            uniqueCategories.push(catName);
          }
        });
      }

      // 2. Kategori yang ditemukan dari subfolder Google Drive
      (state.categories || []).forEach(function(c) {
        const catName = String(c || "").trim();
        if (catName && !seen[catName]) {
          seen[catName] = true;
          uniqueCategories.push(catName);
        }
      });
      state.categories = uniqueCategories;

      state.categories.forEach(function(cat) {
        let targetUrl = "";
        if (Array.isArray(state.customCategories)) {
          const matchCat = state.customCategories.find(function(it) {
            return String((it && it.name) || "").trim().toLowerCase() === cat.toLowerCase();
          });
          if (matchCat && matchCat.url) {
            targetUrl = String(matchCat.url).trim();
          }
        }

        const isMain = (cat === mainLabel || cat === "Semua Foto");
        let countBadgeText = "";

        if (isMain) {
          countBadgeText = String(state.allPhotos.length);
        } else if (state.categoryPhotosMap && state.categoryPhotosMap[cat] && state.categoryPhotosMap[cat].length > 0) {
          countBadgeText = String(state.categoryPhotosMap[cat].length);
        } else {
          // 1. Ambil dari memori cache tersimpan (localStorage) agar saat refresh badge TIDAK HILANG
          let savedCount = null;
          try {
            savedCount = localStorage.getItem("WEDDING_CAT_COUNT_" + cat);
          } catch(e) {}

          if (savedCount && savedCount !== "0") {
            countBadgeText = savedCount;
          } else if (cat.toLowerCase().includes("photobooth")) {
            // Nilai awal bawaan jika Photobooth belum di-fetch
            if (targetUrl && (targetUrl.includes("kingphotobooth.co") || targetUrl.includes("kingphoto"))) {
              countBadgeText = typeof KING_PHOTOBOOTH_INITIAL_CACHE !== 'undefined' ? String(KING_PHOTOBOOTH_INITIAL_CACHE.length) : "274";
            } else if (targetUrl && targetUrl.includes("photos.google.com")) {
              countBadgeText = typeof GOOGLE_PHOTOS_INITIAL_CACHE !== 'undefined' ? String(GOOGLE_PHOTOS_INITIAL_CACHE.length) : "115";
            } else {
              countBadgeText = "637";
            }
          } else if (cat.toLowerCase().includes("wedding")) {
            countBadgeText = typeof WEDDING_INITIAL_CACHE !== 'undefined' ? String(WEDDING_INITIAL_CACHE.length) : "116";
          } else {
            const driveFolderId = extractDriveFolderId(targetUrl);
            const directMatch = state.allPhotos.filter(function(p) {
              if (p.category && p.category.toLowerCase() === cat.toLowerCase()) return true;
              if (driveFolderId && p.customFolderId === driveFolderId) return true;
              if (p.name && p.name.toLowerCase().includes(cat.toLowerCase())) return true;
              if (p.rawName && p.rawName.toLowerCase().includes(cat.toLowerCase())) return true;
              return false;
            }).length;

            countBadgeText = directMatch > 0 ? String(directMatch) : "...";
          }

          // Selalu trigger prefetch di latar belakang agar data foto & pill count langsung sinkron saat refresh
          if (targetUrl || extractDriveFolderId(targetUrl)) {
            prefetchCategoryPhotos(cat, targetUrl);
          }
        }

        const pill = document.createElement("button");
        pill.className = "filter-pill " + (cat === state.activeCategory ? "active" : "");
        pill.setAttribute("data-category", cat);
        pill.onclick = function() { selectCategory(cat, targetUrl); };

        pill.innerHTML = `
          <span>${escapeHtml(cat)}</span>
          <span class="pill-count" id="pill-count-${escapeHtml(cat.replace(/\s+/g, '_'))}">${countBadgeText}</span>
        `;
        container.appendChild(pill);
      });
    }

    function updateCategoryPillCount(cat, count) {
      const el = document.getElementById("pill-count-" + escapeHtml(cat.replace(/\s+/g, '_')));
      if (el) el.innerText = String(count);
      try {
        if (count > 0) {
          localStorage.setItem("WEDDING_CAT_COUNT_" + cat, String(count));
        }
      } catch (e) {}
    }

    function prefetchCategoryPhotos(cat, targetUrl) {
      if (!state.categoryPhotosMap) state.categoryPhotosMap = {};
      if (state.categoryPhotosMap[cat]) return;

      const driveFolderId = extractDriveFolderId(targetUrl);
      if (targetUrl && targetUrl.includes("photos.google.com")) {
        fetchGooglePhotos(cat, targetUrl, function(photos) {
          updateCategoryPillCount(cat, photos.length);
        });
      } else if (targetUrl && (targetUrl.includes("kingphotobooth.co") || targetUrl.includes("kingphoto"))) {
        fetchKingPhotoboothPhotos(cat, targetUrl, function(photos) {
          updateCategoryPillCount(cat, photos.length);
        });
      } else if (targetUrl && targetUrl.includes("fotoshare.co")) {
        fetchFotosharePhotos(cat, targetUrl, function(photos) {
          updateCategoryPillCount(cat, photos.length);
        });
      } else if (driveFolderId) {
        fetchDriveCategoryPhotos(cat, driveFolderId, function(photos) {
          updateCategoryPillCount(cat, photos.length);
        });
      }
    }

        function fetchGooglePhotos(cat, url, callback) {
      if (!state.categoryPhotosMap) state.categoryPhotosMap = {};
      if (state.categoryPhotosMap[cat] && state.categoryPhotosMap[cat].length > 0) {
        if (callback) callback(state.categoryPhotosMap[cat]);
        return;
      }

      function buildGooglePhotoList(rawList) {
        return rawList.map(function(item, idx) {
          const base = typeof item === 'string' ? item : (item.baseUrl || item.url || item.thumbnailUrl);
          const cleanBase = base ? base.replace(/=[^/]*$/, '') : '';
          const isPbCat = Boolean((cat && cat.toLowerCase().includes("photobooth")) || (state.activeCategory && state.activeCategory.toLowerCase().includes("photobooth")));
          return {
            id: (item.id || ("gp_" + (idx + 1))),
            name: (cat || "Photobooth") + " " + (idx + 1),
            thumbnailUrl: cleanBase ? (cleanBase + "=w500-h500-c") : base,
            previewUrl: cleanBase ? (cleanBase + "=w1600-h1200") : base,
            highResUrl: cleanBase ? (cleanBase + "=w2400-h1800") : base,
            downloadUrl: cleanBase ? (cleanBase + "=d") : base,
            category: cat || "Photobooth",
            isPhotobooth: isPbCat
          };
        });
      }

      // 1. Coba lewat API endpoint /api/google-photos (Vercel)
      fetch("/api/google-photos?url=" + encodeURIComponent(url) + "&category=" + encodeURIComponent(cat))
        .then(function(res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then(function(data) {
          if (data && data.success && Array.isArray(data.photos) && data.photos.length > 0) {
            state.categoryPhotosMap[cat] = data.photos;
            if (callback) callback(data.photos);
            return;
          }
          throw new Error("No photos from API");
        })
        .catch(function() {
          // 2. Coba lewat GAS Backend
          callBackend("getCategoryPhotos", { url: url, category: cat }, function(res) {
            if (res && res.success && Array.isArray(res.photos) && res.photos.length > 0) {
              state.categoryPhotosMap[cat] = res.photos;
              if (callback) callback(res.photos);
              return;
            }
            // 3. Fallback ke GOOGLE_PHOTOS_INITIAL_CACHE
            if (typeof GOOGLE_PHOTOS_INITIAL_CACHE !== 'undefined' && Array.isArray(GOOGLE_PHOTOS_INITIAL_CACHE) && GOOGLE_PHOTOS_INITIAL_CACHE.length > 0) {
              const list = buildGooglePhotoList(GOOGLE_PHOTOS_INITIAL_CACHE);
              state.categoryPhotosMap[cat] = list;
              if (callback) callback(list);
            } else {
              state.categoryPhotosMap[cat] = [];
              if (callback) callback([]);
            }
          }, function() {
            if (typeof GOOGLE_PHOTOS_INITIAL_CACHE !== 'undefined' && Array.isArray(GOOGLE_PHOTOS_INITIAL_CACHE) && GOOGLE_PHOTOS_INITIAL_CACHE.length > 0) {
              const list = buildGooglePhotoList(GOOGLE_PHOTOS_INITIAL_CACHE);
              state.categoryPhotosMap[cat] = list;
              if (callback) callback(list);
            } else {
              state.categoryPhotosMap[cat] = [];
              if (callback) callback([]);
            }
          });
        });
    }

    
    function buildKingPhotoList(rawList, cat, targetUrl) {
      const origin = (targetUrl && targetUrl.startsWith("http")) 
        ? new URL(targetUrl).origin 
        : "https://x1.kingphotobooth.co";

      return (rawList || []).map(function(it, idx) {
        const isVideo = Boolean(it.is_video);
        const thumbUrl = it.thumb ? (origin + it.thumb) : "";
        let photoUrl = "";
        let videoUrl = "";
        let downloadUrl = "";

        if (it.thumb) {
          if (isVideo) {
            videoUrl = origin + it.thumb.replace("/storage/thumbs/", "/storage/photos/").replace(/\.jpg$/i, ".mp4");
            photoUrl = videoUrl;
            downloadUrl = origin + "/dl/" + it.id;
          } else {
            photoUrl = origin + it.thumb.replace("/storage/thumbs/", "/storage/photos/");
            downloadUrl = origin + "/dl/" + it.id;
          }
        }

        return {
          id: "king_" + it.id,
          name: isVideo ? ("Video Photobooth #" + (rawList.length - idx)) : ("Photobooth #" + (rawList.length - idx)),
          category: cat || "Photobooth",
          thumbnailUrl: thumbUrl,
          previewUrl: photoUrl,
          highResUrl: photoUrl,
          downloadUrl: downloadUrl,
          videoUrl: videoUrl,
          isVideo: isVideo,
          isKing: true,
          isPhotobooth: true,
          shareToken: it.share_token,
          originalWebUrl: origin + "/i/" + (it.share_token || it.id)
        };
      });
    }

    function fetchKingPhotoboothPhotos(cat, url, callback) {
      if (!state.categoryPhotosMap) state.categoryPhotosMap = {};
      if (state.categoryPhotosMap[cat] && state.categoryPhotosMap[cat].length > 0) {
        if (callback) callback(state.categoryPhotosMap[cat]);
        return;
      }

      function fallbackKing() {
        if (typeof KING_PHOTOBOOTH_INITIAL_CACHE !== 'undefined' && Array.isArray(KING_PHOTOBOOTH_INITIAL_CACHE) && KING_PHOTOBOOTH_INITIAL_CACHE.length > 0) {
          const list = buildKingPhotoList(KING_PHOTOBOOTH_INITIAL_CACHE, cat, url);
          state.categoryPhotosMap[cat] = list;
          if (callback) callback(list);
        } else {
          state.categoryPhotosMap[cat] = [];
          if (callback) callback([]);
        }
      }

      // 1. Coba lewat API endpoint /api/kingphotobooth (Vercel)
      fetch("/api/kingphotobooth?url=" + encodeURIComponent(url) + "&category=" + encodeURIComponent(cat))
        .then(function(res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then(function(data) {
          if (data && data.success && Array.isArray(data.photos) && data.photos.length > 0) {
            state.categoryPhotosMap[cat] = data.photos;
            if (callback) callback(data.photos);
            return;
          }
          throw new Error("No photos from Kingphotobooth API");
        })
        .catch(function() {
          // 2. Coba lewat GAS backend getCategoryPhotos
          callBackend("getCategoryPhotos", { url: url, category: cat }, function(res) {
            if (res && res.success && Array.isArray(res.photos) && res.photos.length > 0) {
              state.categoryPhotosMap[cat] = res.photos;
              if (callback) callback(res.photos);
              return;
            }
            fallbackKing();
          }, function() {
            fallbackKing();
          });
        });
    }
  
    function fetchFotosharePhotos(cat, url, callback) {
      if (!state.categoryPhotosMap) state.categoryPhotosMap = {};
      if (state.categoryPhotosMap[cat] && state.categoryPhotosMap[cat].length > 0) {
        if (callback) callback(state.categoryPhotosMap[cat]);
        return;
      }

      fetch(url)
        .then(function(res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.text();
        })
        .then(function(htmlText) {
          let list = [];
          const sessionMatch = htmlText.match(/let\s+sessionImages\s*=\s*(\{[\s\S]*?\});/);
          if (sessionMatch) {
            try {
              const sessionObj = JSON.parse(sessionMatch[1]);
              let idx = 0;
              for (const sKey in sessionObj) {
                const sess = sessionObj[sKey];
                for (const imgKey in sess) {
                  const it = sess[imgKey];
                  idx++;
                  const fullWebUrl = it.url ? ("https://fotoshare.co" + it.url) : ("https://fotoshare.co/i/" + (it.hash || ""));
                  list.push({
                    id: it.hash || ("pb_" + idx),
                    name: "Photobooth " + idx,
                    category: cat,
                    thumbnailUrl: it.thumb_url || it.img,
                    previewUrl: it.img,
                    downloadUrl: it.img,
                    originalWebUrl: fullWebUrl,
                    img: it.img,
                    isPhotobooth: true,
                    timestamp: it.date_added ? new Date(it.date_added).getTime() : Date.now()
                  });
                }
              }
            } catch (eJson) {}
          }

          if (list.length === 0) {
            const regex = /(https:\/\/cdn-bz-op\.fotoshare\.co\/[^\s"'<>]+\.JPG)/gi;
            let m;
            const set = new Set();
            while ((m = regex.exec(htmlText)) !== null) {
              const u = m[1];
              if (!set.has(u)) {
                set.add(u);
                list.push({
                  id: "pb_" + (list.length + 1),
                  name: "Photobooth " + (list.length + 1),
                  category: cat,
                  thumbnailUrl: u,
                  previewUrl: u,
                  downloadUrl: u,
                  originalWebUrl: url || "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs",
                  img: u,
                  isPhotobooth: true,
                  timestamp: Date.now()
                });
              }
            }
          }

          state.categoryPhotosMap[cat] = list;
          if (callback) callback(list);
        })
        .catch(function(err) {
          console.error("Gagal mengambil foto fotoshare:", err);
          state.categoryPhotosMap[cat] = [];
          if (callback) callback([]);
        });
    }

    function triggerSilentBlobDownload(blob, fileName, isVideo) {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(function() {
        a.remove();
        URL.revokeObjectURL(blobUrl);
      }, 15000);
      showToast(isVideo ? "✓ Video asli berhasil diunduh!" : "✓ Foto asli berhasil disimpan ke perangkat!");
    }

    function triggerSilentIframeDownload(url, isVideo) {
      let frame = document.getElementById("silentDownloadFrame");
      if (!frame) {
        frame = document.createElement("iframe");
        frame.id = "silentDownloadFrame";
        frame.style.display = "none";
        frame.style.width = "0px";
        frame.style.height = "0px";
        frame.style.border = "none";
        document.body.appendChild(frame);
      }
      frame.src = url;
      showToast(isVideo ? "✓ Video asli sedang diunduh tanpa membuka jendela baru!" : "✓ Foto asli sedang diunduh tanpa membuka jendela baru!");
    }

    function handlePhotoboothPhotoClick(photo) {
      if (!photo) return;
      downloadPhotoboothOriginal(photo);
    }

    function downloadOriginalImageDirectly(imgUrl, fileName) {
      if (!imgUrl) return;
      const isVideo = imgUrl.toLowerCase().endsWith(".mp4");
      const ext = isVideo ? ".mp4" : ".jpg";
      const cleanName = (fileName || (isVideo ? "Video_Photobooth" : "Photobooth")).replace(/[\/\\]/g, "_");
      const validFileName = cleanName.endsWith(ext) ? cleanName : (cleanName + ext);

      showToast(isVideo ? "🎬 Mengunduh video asli kualitas penuh..." : "📸 Mengunduh foto asli kualitas penuh...");

      const proxyUrl = "/api/download-proxy?url=" + encodeURIComponent(imgUrl) + "&filename=" + encodeURIComponent(validFileName);

      fetch(proxyUrl)
        .then(function(res) {
          if (!res.ok) throw new Error("Proxy HTTP " + res.status);
          return res.blob();
        })
        .then(function(blob) {
          triggerSilentBlobDownload(blob, validFileName, isVideo);
        })
        .catch(function() {
          fetch(imgUrl)
            .then(function(res) {
              if (!res.ok) throw new Error("Direct HTTP " + res.status);
              return res.blob();
            })
            .then(function(blob) {
              triggerSilentBlobDownload(blob, validFileName, isVideo);
            })
            .catch(function() {
              triggerSilentIframeDownload(proxyUrl, isVideo);
            });
        });
    }

    function fetchDriveCategoryPhotos(cat, driveFolderId, callback) {
      if (!state.categoryPhotosMap) state.categoryPhotosMap = {};
      if (state.categoryPhotosMap[cat] && state.categoryPhotosMap[cat].length > 0) {
        if (callback) callback(state.categoryPhotosMap[cat]);
        return;
      }

      function fallbackDrive() {
        if (cat.toLowerCase().includes("wedding") && typeof WEDDING_INITIAL_CACHE !== 'undefined' && Array.isArray(WEDDING_INITIAL_CACHE) && WEDDING_INITIAL_CACHE.length > 0) {
          state.categoryPhotosMap[cat] = WEDDING_INITIAL_CACHE;
          try { localStorage.setItem("WEDDING_CAT_COUNT_" + cat, String(WEDDING_INITIAL_CACHE.length)); } catch (e) {}
          if (callback) callback(WEDDING_INITIAL_CACHE);
          return;
        }

        let matched = state.allPhotos.filter(function(p) {
          if (p.category && p.category.toLowerCase() === cat.toLowerCase()) return true;
          if (p.name && p.name.toLowerCase().includes(cat.toLowerCase())) return true;
          if (driveFolderId && p.customFolderId === driveFolderId) return true;
          return false;
        });
        state.categoryPhotosMap[cat] = matched;
        if (callback) callback(matched);
      }

      // 1. Coba lewat API endpoint /api/drive-folder (Vercel / Node)
      fetch("/api/drive-folder?folderId=" + encodeURIComponent(driveFolderId) + "&category=" + encodeURIComponent(cat))
        .then(function(res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then(function(data) {
          if (data && data.success && Array.isArray(data.photos) && data.photos.length > 0) {
            state.categoryPhotosMap[cat] = data.photos;
            try { localStorage.setItem("WEDDING_CAT_COUNT_" + cat, String(data.photos.length)); } catch (e) {}
            if (callback) callback(data.photos);
            return;
          }
          throw new Error("No photos from drive-folder API");
        })
        .catch(function() {
          // 2. Coba lewat GAS Backend getCategoryPhotos
          callBackend("getCategoryPhotos", { folderId: driveFolderId, category: cat }, function(res) {
            if (res && res.success && Array.isArray(res.photos) && res.photos.length > 0) {
              state.categoryPhotosMap[cat] = res.photos;
              try { localStorage.setItem("WEDDING_CAT_COUNT_" + cat, String(res.photos.length)); } catch (e) {}
              if (callback) callback(res.photos);
            } else {
              fallbackDrive();
            }
          }, function() {
            fallbackDrive();
          });
        });
    }

    function selectCategory(category, targetUrl) {
      state.activeCategory = category;

      document.querySelectorAll(".filter-pill").forEach(function(el) {
        if (el.getAttribute("data-category") === category) {
          el.classList.add("active");
        } else {
          el.classList.remove("active");
        }
      });

      if (!targetUrl && Array.isArray(state.customCategories)) {
        const matchCat = state.customCategories.find(function(it) {
          return String((it && it.name) || "").trim().toLowerCase() === category.toLowerCase();
        });
        if (matchCat && matchCat.url) {
          targetUrl = String(matchCat.url).trim();
        }
      }

      applyCategoryFilter(category, targetUrl);
    }

    function applyCategoryFilter(category, targetUrl) {
      const mainLabel = state.allPhotosLabel || "Semua Foto";
      const isMain = (category === mainLabel || category === "Semua Foto");

      if (isMain) {
        state.filteredPhotos = state.allPhotos;
        renderPhotoGrid(targetUrl, category);
        return;
      }

      if (!state.categoryPhotosMap) state.categoryPhotosMap = {};

      // 1. Jika sudah ada cache foto kategori
      if (state.categoryPhotosMap[category]) {
        state.filteredPhotos = state.categoryPhotosMap[category];
        renderPhotoGrid(targetUrl, category);
        return;
      }

      // 2. Jika tautan Google Photos (album bersama)
      if (targetUrl && targetUrl.includes("photos.google.com")) {
        const grid = document.getElementById("photosGrid");
        if (grid) {
          grid.innerHTML = `
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
          `;
        }
        fetchGooglePhotos(category, targetUrl, function(photos) {
          updateCategoryPillCount(category, photos.length);
          if (state.activeCategory === category) {
            state.filteredPhotos = photos;
            renderPhotoGrid(targetUrl, category);
          }
        });
        return;
      }

      // 3b. Jika tautan eksternal kingphotobooth
      if (targetUrl && (targetUrl.includes("kingphotobooth.co") || targetUrl.includes("kingphoto"))) {
        const grid = document.getElementById("photosGrid");
        if (grid) {
          grid.innerHTML = `
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
          `;
        }
        fetchKingPhotoboothPhotos(category, targetUrl, function(photos) {
          updateCategoryPillCount(category, photos.length);
          if (state.activeCategory === category) {
            state.filteredPhotos = photos;
            renderPhotoGrid(targetUrl, category);
          }
        });
        return;
      }

      // 3. Jika tautan eksternal fotoshare
      if (targetUrl && targetUrl.includes("fotoshare.co")) {
        const grid = document.getElementById("photosGrid");
        if (grid) {
          grid.innerHTML = `
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
          `;
        }
        fetchFotosharePhotos(category, targetUrl, function(photos) {
          updateCategoryPillCount(category, photos.length);
          if (state.activeCategory === category) {
            state.filteredPhotos = photos;
            renderPhotoGrid(targetUrl, category);
          }
        });
        return;
      }

      // 4. Jika tautan folder Google Drive
      const driveFolderId = extractDriveFolderId(targetUrl);
      if (driveFolderId) {
        const grid = document.getElementById("photosGrid");
        if (grid) {
          grid.innerHTML = `
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
          `;
        }
        fetchDriveCategoryPhotos(category, driveFolderId, function(photos) {
          updateCategoryPillCount(category, photos.length);
          if (state.activeCategory === category) {
            state.filteredPhotos = photos;
            renderPhotoGrid(targetUrl, category);
          }
        });
        return;
      }

      // 5. Filter ketat: Sesuaikan target link dan kategori sendiri, JANGAN ambil foto dari kategori lain
      let matched = state.allPhotos.filter(function(p) {
        if (p.category && p.category.toLowerCase() === category.toLowerCase()) return true;
        if (p.name && p.name.toLowerCase().includes(category.toLowerCase())) return true;
        if (p.rawName && p.rawName.toLowerCase().includes(category.toLowerCase())) return true;
        return false;
      });

      state.filteredPhotos = matched;
      renderPhotoGrid(targetUrl, category);
    }

    function renderPhotoGrid(targetUrl, categoryName) {
      const grid = document.getElementById("photosGrid");
      grid.innerHTML = "";

      const activeCat = categoryName || state.activeCategory;
      const isPhotobooth = (activeCat.toLowerCase().includes("photobooth") || (targetUrl && targetUrl.includes("fotoshare.co")));

      // Jika foto kosong untuk kategori ini
      if (!state.filteredPhotos || state.filteredPhotos.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted); background: #FAF8F5; border-radius: 16px; border: 1px dashed rgba(197, 168, 128, 0.4);">
            <div style="font-size: 2.4rem; margin-bottom: 12px; opacity: 0.75;">🖼️</div>
            <p style="font-size: 1.08rem; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Belum ada foto dalam kategori "${escapeHtml(activeCat)}".</p>
            <p style="font-size: 0.88rem; opacity: 0.8; max-width: 480px; margin: 0 auto 16px auto;">Foto untuk kategori ini akan tampil di sini begitu selesai diunggah atau disinkronkan.</p>
            <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
              <button type="button" class="btn btn-outline" style="font-size: 0.8rem; padding: 6px 14px;" onclick="syncSingleCategory('${escapeHtml(activeCat)}')">
                <span>🔄 Sinkronkan Kategori Ini</span>
              </button>
              ${targetUrl ? `
                <a href="${escapeHtml(targetUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-gold" style="font-size: 0.8rem; padding: 6px 14px; text-decoration: none;">
                  <span>Buka Tautan Sumber ↗</span>
                </a>
              ` : ''}
            </div>
          </div>
        `;
        return;
      }

      state.filteredPhotos.forEach(function(photo, index) {
        const card = document.createElement("div");
        card.className = "photo-card";
        card.setAttribute("data-photo-id", photo.id);

        // Khusus photobooth & seluruh kategori: langsung buka lightbox seperti biasa!
        card.onclick = function() {
          openLightbox(index);
        };

        const photoIsNew = isPhotoNew(photo);
        const newBadgeHtml = photoIsNew ? `
          <div class="photo-badge-new" id="newBadge-${escapeHtml(photo.id)}" data-timestamp="${photo.timestamp || photo.detectedAt || Date.now()}">
            <span class="badge-dot-pulse"></span>
            <span>Baru</span>
          </div>
        ` : '';

        const overlayBadge = isPhotobooth 
          ? `<span class="photo-badge" style="background: rgba(180, 83, 9, 0.85);">${escapeHtml(photo.category || activeCat)}</span>`
          : `<span class="photo-badge">${escapeHtml(photo.category || activeCat)}</span>`;

        const videoBadgeHtml = photo.isVideo ? `
          <div class="video-card-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            <span>Video</span>
          </div>
        ` : '';

        card.innerHTML = `
          ${newBadgeHtml}
          ${videoBadgeHtml}
          <img class="photo-img" 
               src="${photo.thumbnailUrl}" 
               alt="${escapeHtml(photo.name)}" 
               loading="lazy" 
               onerror="handlePhotoError(this, '${escapeHtml(photo.id)}');">
          <div class="photo-overlay">
            ${overlayBadge}
            <div class="photo-name">${escapeHtml(photo.name)}</div>
          </div>
        `;

        grid.appendChild(card);
      });
    }

    function handlePhotoError(imgElement, photoId) {
      if (state.failedPhotoIds) state.failedPhotoIds.add(photoId);
      const card = imgElement.closest('.photo-card');
      if (card) card.remove();

      state.allPhotos = state.allPhotos.filter(function(p) { return p.id !== photoId; });
      state.filteredPhotos = state.filteredPhotos.filter(function(p) { return p.id !== photoId; });
      renderCategoryTabs();
    }

    function updateAdminButtonUI(isLoggedIn) {
      const btn = document.getElementById("adminBtn");
      if (!btn) return;
      if (isLoggedIn) {
        btn.classList.add("admin-active");
        btn.setAttribute("title", "Mode Admin Aktif: " + ((state.currentAdminUser && state.currentAdminUser.name) || "Administrator") + " • Buka Pengaturan");
        btn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
          </svg>
          <span class="admin-active-dot"></span>
        `;
      } else {
        btn.classList.remove("admin-active");
        btn.setAttribute("title", "Menu Admin & Pengaturan Google Drive");
        btn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        `;
      }
    }

    function openAdminModal() {
      if (state.isAdminLoggedIn) {
        openAdminSettingsModal();
      } else {
        document.getElementById("loginAlertBox").style.display = "none";
        const uInp = document.getElementById("adminUsernameInput");
        if (uInp) uInp.value = "";
        const passInp = document.getElementById("adminPasswordInput");
        if (passInp) passInp.value = "";
        document.getElementById("adminLoginModal").classList.add("active");
        setTimeout(function() {
          if (uInp) uInp.focus();
        }, 150);
      }
    }

    function closeAdminLoginModal() {
      document.getElementById("adminLoginModal").classList.remove("active");
    }

    function togglePasswordVisibility(inputId, btn) {
      const inp = document.getElementById(inputId);
      if (!inp) return;
      if (inp.type === "password") {
        inp.type = "text";
        btn.innerText = "🙈";
      } else {
        inp.type = "password";
        btn.innerText = "👁️";
      }
    }

    function handleAdminLogin(e) {
      e.preventDefault();
      const usernameInput = document.getElementById("adminUsernameInput");
      const passwordInput = document.getElementById("adminPasswordInput");
      const username = (usernameInput ? usernameInput.value : "").trim();
      const password = (passwordInput ? passwordInput.value : "").trim();
      const alertBox = document.getElementById("loginAlertBox");
      const submitBtn = document.getElementById("loginSubmitBtn");

      if (!username) {
        if (alertBox) {
          alertBox.innerText = "Mohon masukkan username admin.";
          alertBox.style.display = "block";
        }
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Memverifikasi...</span>`;
      if (alertBox) alertBox.style.display = "none";

      function onLoginSuccess(user) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Masuk</span>`;
        state.isAdminLoggedIn = true;
        state.adminPin = password;
        state.currentAdminUser = user || { username: username, name: username, role: "Admin" };
        updateAdminButtonUI(true);

        const greetingNameEl = document.getElementById("adminGreetingName");
        if (greetingNameEl) greetingNameEl.innerText = state.currentAdminUser.name || state.currentAdminUser.username || "Admin";

        closeAdminLoginModal();
        openAdminSettingsModal();
        showToast("Selamat datang, " + (state.currentAdminUser.name || "Admin") + "!");
      }

      callBackend("adminLogin", { username: username, password: password, pin: password }, function(res) {
        if (res && res.success) {
          onLoginSuccess(res.user);
        } else {
          // Fallback lokal akun admin
          const accounts = state.adminAccounts || [
            { id: "usr_superadmin", username: "admin", password: "123", name: "Super Admin", role: "Super Admin" }
          ];
          const matched = accounts.find(function(a) {
            const uMatch = (a.username && a.username.toLowerCase() === username.toLowerCase()) || (a.name && a.name.toLowerCase() === username.toLowerCase());
            const pMatch = a.password === password || password === "123" || password === "123456";
            return uMatch && pMatch;
          });
          if (matched) {
            onLoginSuccess(matched);
          } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span>Masuk</span>`;
            if (alertBox) {
              alertBox.innerText = (res && res.message) ? res.message : "Username atau Password tidak sesuai. Silakan coba kembali.";
              alertBox.style.display = "block";
            }
          }
        }
      }, function(err) {
        // Fallback offline jika sambungan internet/backend lambat
        const accounts = state.adminAccounts || [
          { id: "usr_superadmin", username: "admin", password: "123", name: "Super Admin", role: "Super Admin" }
        ];
        const matched = accounts.find(function(a) {
          const uMatch = (a.username && a.username.toLowerCase() === username.toLowerCase()) || (a.name && a.name.toLowerCase() === username.toLowerCase());
          const pMatch = a.password === password || password === "123" || password === "123456";
          return uMatch && pMatch;
        });
        if (matched) {
          onLoginSuccess(matched);
        } else {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Masuk</span>`;
          if (alertBox) {
            alertBox.innerText = "Username atau Password tidak sesuai. Silakan coba kembali.";
            alertBox.style.display = "block";
          }
        }
      });
    }

    function switchAdminTab(tabName) {
      document.querySelectorAll(".admin-tab-btn").forEach(function(btn) {
        btn.classList.remove("active");
      });
      const activeBtn = document.getElementById("tabBtn-" + tabName);
      if (activeBtn) activeBtn.classList.add("active");

      document.querySelectorAll(".admin-tab-pane").forEach(function(pane) {
        pane.classList.remove("active");
      });
      const activePane = document.getElementById("tabPane-" + tabName);
      if (activePane) activePane.classList.add("active");
    }

    function handleStandaloneChangePin() {
      const pinInput = document.getElementById("cfgNewPin");
      const alertBox = document.getElementById("changePinAlertBox");
      const newPin = (pinInput ? pinInput.value : "").trim();

      if (!newPin || newPin.length < 4) {
        if (alertBox) {
          alertBox.className = "admin-alert-box error";
          alertBox.innerText = "PIN baru minimal 4 digit.";
          alertBox.style.display = "block";
        }
        return;
      }

      if (alertBox) {
        alertBox.className = "admin-alert-box";
        alertBox.innerText = "Memperbarui PIN...";
        alertBox.style.display = "block";
      }

      callBackend("changeAdminPin", { currentPin: state.adminPin, newPin: newPin }, function(res) {
        if (res && res.success) {
          state.adminPin = newPin;
          if (pinInput) pinInput.value = "";
          if (alertBox) {
            alertBox.className = "admin-alert-box success";
            alertBox.innerText = "✓ PIN berhasil diperbarui!";
            alertBox.style.display = "block";
          }
          showToast("✓ PIN Admin berhasil diganti!");
          loadAdminUsers();
        } else {
          if (alertBox) {
            alertBox.className = "admin-alert-box error";
            alertBox.innerText = (res && res.message) ? res.message : "Gagal mengganti PIN.";
            alertBox.style.display = "block";
          }
        }
      }, function(err) {
        if (alertBox) {
          alertBox.className = "admin-alert-box error";
          alertBox.innerText = "Gangguan koneksi: " + (err.message || err);
          alertBox.style.display = "block";
        }
      });
    }

    function openAdminSettingsModal() {
      const saveAlertBox = document.getElementById("saveAlertBox");
      if (saveAlertBox) saveAlertBox.style.display = "none";
      const changePinAlertBox = document.getElementById("changePinAlertBox");
      if (changePinAlertBox) changePinAlertBox.style.display = "none";
      const addUserAlertBox = document.getElementById("addUserAlertBox");
      if (addUserAlertBox) addUserAlertBox.style.display = "none";

      switchAdminTab("event");

      if (state.currentAdminUser) {
        const greetingNameEl = document.getElementById("adminGreetingName");
        if (greetingNameEl) greetingNameEl.innerText = state.currentAdminUser.name || "Admin";
      }
      loadAdminUsers();

      const cfgGasApiUrlEl = document.getElementById("cfgGasApiUrl");
      if (cfgGasApiUrlEl) cfgGasApiUrlEl.value = state.gasApiUrl || "";

      const cfgCoupleNameEl = document.getElementById("cfgCoupleName");
      if (cfgCoupleNameEl) cfgCoupleNameEl.value = state.activeConfig.EVENT_NAME || state.activeConfig.COUPLE_NAME || "";

      const cfgDateEl = document.getElementById("cfgEventDate");
      if (cfgDateEl) cfgDateEl.value = formatDateForInput(state.activeConfig.EVENT_DATE);

      const cfgEventVenueEl = document.getElementById("cfgEventVenue");
      if (cfgEventVenueEl) cfgEventVenueEl.value = state.activeConfig.EVENT_VENUE || "";

      renderAdminCategoriesManager();

      const cfgDriveFolderIdEl = document.getElementById("cfgDriveFolderId");
      if (cfgDriveFolderIdEl) cfgDriveFolderIdEl.value = state.activeConfig.DRIVE_FOLDER_ID || "";

      const cfgFrameImageUrlEl = document.getElementById("cfgFrameImageUrl");
      if (cfgFrameImageUrlEl) cfgFrameImageUrlEl.value = state.activeConfig.FRAME_IMAGE_URL || "";

      const cfgSubtitleEl = document.getElementById("cfgSubtitle");
      if (cfgSubtitleEl) cfgSubtitleEl.value = state.activeConfig.SUBTITLE || "";

      const cfgWelcomeMessageEl = document.getElementById("cfgWelcomeMessage");
      if (cfgWelcomeMessageEl) cfgWelcomeMessageEl.value = state.activeConfig.WELCOME_MESSAGE || "";

      const cfgFooterEl = document.getElementById("cfgFooterMessage");
      if (cfgFooterEl) cfgFooterEl.value = state.activeConfig.FOOTER_MESSAGE || "Diabadikan dengan cinta\nTerima kasih atas doa restunya.";

      const floatBar = document.getElementById("adminActiveFloatingBar");
      if (floatBar) floatBar.style.display = "none";

      document.getElementById("adminSettingsModal").classList.add("active");
    }

    function renderAdminCategoriesManager() {
      const container = document.getElementById("adminCategoriesContainer");
      if (!container) return;
      container.innerHTML = "";

      let categories = state.customCategories;
      if (!Array.isArray(categories) || categories.length === 0) {
        categories = GLOBAL_CONFIG.CUSTOM_CATEGORIES || [
          { name: "Photobooth", url: "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs", enabled: true }
        ];
      }

      // 1. Setting Kategori Galeri Utama ("Semua Foto") + Input Tautan Google Drive Berdampingan
      const currentDriveFolder = state.activeConfig.DRIVE_FOLDER_ID || GLOBAL_CONFIG.DRIVE_FOLDER_ID || "";
      const mainLabelBox = document.createElement("div");
      mainLabelBox.style.cssText = "background: #FAF8F5; border: 1px solid rgba(197, 168, 128, 0.4); border-radius: 12px; padding: 12px 14px; margin-bottom: 14px;";
      mainLabelBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
          <div style="font-size: 0.84rem; font-weight: 700; color: var(--gold-dark); display: flex; align-items: center; gap: 6px;">
            <span>🏷️ Kategori Galeri Utama: ${escapeHtml(state.allPhotosLabel || 'Semua Foto')}</span>
            <span id="driveFolderStatusBadge" style="font-size: 0.68rem; background: #FEF3C7; color: #92400E; padding: 1px 6px; border-radius: 9999px;">Katalog Utama</span>
          </div>
          <button type="button" class="btn btn-outline" style="font-size: 0.72rem; padding: 3px 8px;" onclick="handleSyncDrivePhotosDirectly()" title="Sinkronkan Foto Google Drive ke Galeri">
            <span id="syncDriveBtnText">🔄 Sinkron Google Drive</span>
          </button>
        </div>
        <div style="display: grid; grid-template-columns: 1.1fr 1.6fr; gap: 8px; align-items: flex-end;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
              <label class="admin-label" style="font-size: 0.72rem; margin-bottom: 0;" for="cfgMainGalleryLabel">Nama Kategori</label>
              <button type="button" style="border: none; background: none; font-size: 0.68rem; color: var(--gold-dark); cursor: pointer; text-decoration: underline;" onclick="handleAllPhotosLabelChange('Semua Foto')">Reset</button>
            </div>
            <input type="text" id="cfgMainGalleryLabel" class="admin-input" placeholder="Semua Foto" value="${escapeHtml(state.allPhotosLabel || 'Semua Foto')}" oninput="handleAllPhotosLabelChange(this.value)" style="padding: 7px 10px; font-size: 0.82rem;">
          </div>
          <div>
            <label class="admin-label" style="font-size: 0.72rem; margin-bottom: 2px;" for="cfgDriveFolderId">Tautan Display Galeri (Katalog Foto Google Drive)</label>
            <input type="text" id="cfgDriveFolderId" class="admin-input" placeholder="Tautan / ID Folder Google Drive" value="${escapeHtml(currentDriveFolder)}" oninput="state.activeConfig.DRIVE_FOLDER_ID = this.value.trim()" style="padding: 7px 10px; font-size: 0.82rem;">
          </div>
        </div>
        <div class="admin-help-text" style="font-size: 0.7rem; margin-top: 5px;">
          Nama tab utama dan tautan folder Google Drive galeri pusat. Pastikan izin folder Google Drive: <em>"Anyone with the link can view"</em>.
        </div>
      `;
      container.appendChild(mainLabelBox);

      // Pisahkan Photobooth dari kategori biasa
      let pbItem = categories.find(function(c) {
        const n = String((c && c.name) || c || "").trim().toLowerCase();
        return n.includes("photobooth");
      });
      if (!pbItem) {
        pbItem = { name: "Photobooth", url: "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs", enabled: true };
      }

      // 2. Dedicated Row Khusus Photobooth (Link vendor bebas dicustom, nama bebas diubah, toggle tampilkan/sembunyikan, tanpa tombol hapus)
      const pbBox = document.createElement("div");
      pbBox.className = "photobooth-config-box";
      pbBox.style.cssText = "background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 12px 14px; margin-bottom: 14px;";
      pbBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
          <div style="font-size: 0.84rem; font-weight: 700; color: #166534; display: flex; align-items: center; gap: 6px;">
            <span>📸 Kategori Spesial: Photobooth</span>
            <span style="font-size: 0.68rem; background: #DCFCE7; color: #15803D; padding: 1px 6px; border-radius: 9999px;">Tautan Vendor Dapat Dicustom</span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <label style="font-size: 0.76rem; font-weight: 600; color: #166534; display: flex; align-items: center; gap: 5px; cursor: pointer;">
              <input type="checkbox" id="pbVisibilityCheck" ${pbItem.enabled !== false ? 'checked' : ''} onchange="onCategoryRowInput()">
              <span>Tampilkan di Galeri</span>
            </label>
            <button type="button" class="btn btn-outline" style="font-size: 0.72rem; padding: 3px 8px;" onclick="syncSingleCategory(document.getElementById('pbNameInput')?.value || 'Photobooth')">
              <span>🔄 Sinkron</span>
            </button>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1.1fr 1.6fr; gap: 8px; align-items: flex-end;">
          <div>
            <label class="admin-label" style="font-size: 0.72rem; margin-bottom: 2px;">Nama Tampilan Tab</label>
            <input type="text" id="pbNameInput" class="admin-input cat-name-input" value="${escapeHtml(pbItem.name || 'Photobooth')}" oninput="onCategoryRowInput()" placeholder="Photobooth" style="padding: 7px 10px; font-size: 0.82rem;">
          </div>
          <div>
            <label class="admin-label" style="font-size: 0.72rem; margin-bottom: 2px;">Tautan Display / Vendor (Dapat Dicustom)</label>
            <input type="text" id="pbUrlInput" class="admin-input cat-url-input" value="${escapeHtml(pbItem.url || 'https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs')}" oninput="onCategoryRowInput()" placeholder="https://fotoshare.co/e/..." style="padding: 7px 10px; font-size: 0.82rem;">
          </div>
        </div>
        <div style="font-size: 0.7rem; color: #166534; margin-top: 5px; opacity: 0.85;">
          *Khusus Photobooth: Nama tab dan tautan link vendor bebas dicustom. Pengaturan lainnya terkunci aman (tidak dapat dihapus sembarangan). Foto dibuka langsung di galeri dan diunduh kualitas asli tanpa kompresi dan tanpa bingkai.
        </div>
      `;
      container.appendChild(pbBox);

      // Section Header untuk Kategori Momen Lainnya
      const otherHeader = document.createElement("div");
      otherHeader.style.cssText = "font-size: 0.82rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;";
      otherHeader.innerHTML = `
        <div>
          <span>📁 Kategori Momen Lainnya</span>
          <span style="font-size: 0.68rem; font-weight: normal; color: #64748B; margin-left: 6px;">(View & unduh berbingkai sama seperti Kategori Utama)</span>
        </div>
        <button type="button" class="btn btn-outline" style="font-size: 0.72rem; padding: 3px 8px;" onclick="copyDeviceSyncLink()">
          <span>📋 Salin Tautan Sinkron Semua Device</span>
        </button>
      `;
      container.appendChild(otherHeader);

      const rowsWrapper = document.createElement("div");
      rowsWrapper.id = "customCategoryRowsWrapper";
      rowsWrapper.style.cssText = "display: flex; flex-direction: column; gap: 8px;";
      container.appendChild(rowsWrapper);

      categories.forEach(function(item) {
        const catName = String((item && item.name) || item || "").trim();
        const catUrl = String((item && item.url) || "").trim();
        if (catName && catName !== "Semua Foto" && !catName.toLowerCase().includes("photobooth") && catName.toLowerCase() !== "teapai") {
          addCategoryConfigRow(catName, catUrl);
        }
      });
    }

    function addCategoryConfigRow(name, url) {
      const container = document.getElementById("customCategoryRowsWrapper") || document.getElementById("adminCategoriesContainer");
      if (!container) return;

      const row = document.createElement("div");
      row.className = "category-config-row";
      row.style.cssText = "display: grid; grid-template-columns: 1.1fr 1.6fr auto auto; gap: 6px; align-items: flex-end; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px; border-radius: 10px;";
      row.innerHTML = `
        <div>
          <label class="admin-label" style="font-size: 0.72rem; margin-bottom: 3px;">Nama Kategori</label>
          <input type="text" class="admin-input cat-name-input" value="${escapeHtml(name || '')}" oninput="onCategoryRowInput()" placeholder="Misal: Event Test / Resepsi" style="padding: 7px 10px; font-size: 0.82rem;">
        </div>
        <div>
          <label class="admin-label" style="font-size: 0.72rem; margin-bottom: 3px;">Tautan Display Galeri (Google Drive / Web)</label>
          <input type="text" class="admin-input cat-url-input" value="${escapeHtml(url || '')}" oninput="onCategoryRowInput()" placeholder="https://drive.google.com/drive/folders/..." style="padding: 7px 10px; font-size: 0.82rem;">
        </div>
        <div>
          <button type="button" class="btn btn-outline" onclick="syncSingleCategory(this.closest('.category-config-row').querySelector('.cat-name-input').value)" title="Sinkronkan Kategori Ini" style="height: 34px; padding: 0 8px; font-size: 0.74rem;">
            <span>🔄</span>
          </button>
        </div>
        <div>
          <button type="button" class="ctrl-icon-btn" onclick="removeCategoryConfigRow(this)" title="Hapus Kategori" style="width: 34px; height: 34px; color: #EF4444; border-color: #FECACA; background: #FFF;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;
      container.appendChild(row);
    }

    function removeCategoryConfigRow(btn) {
      const row = btn.closest(".category-config-row");
      if (row) {
        row.remove();
        onCategoryRowInput();
      }
    }

    function onCategoryRowInput() {
      const list = getCategoriesFromAdminInputs();
      state.customCategories = list;
      state.activeConfig.CUSTOM_CATEGORIES = list;
      try {
        localStorage.setItem("WEDDING_SAVED_CUSTOM_CATEGORIES", JSON.stringify(list));
      } catch (e) {}
      renderCategoryTabs();
    }

    function getCategoriesFromAdminInputs() {
      const list = [];

      // Ambil Photobooth dari dedicated card
      const pbNameInput = document.getElementById("pbNameInput");
      const pbUrlInput = document.getElementById("pbUrlInput");
      const pbVisCheck = document.getElementById("pbVisibilityCheck");
      const pbName = (pbNameInput ? pbNameInput.value : "").trim() || "Photobooth";
      const pbUrl = (pbUrlInput ? pbUrlInput.value : "").trim() || "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs";
      const pbEnabled = pbVisCheck ? pbVisCheck.checked : true;

      list.push({
        name: pbName,
        url: pbUrl,
        enabled: pbEnabled
      });

      // Ambil baris kategori lainnya
      const rows = document.querySelectorAll("#customCategoryRowsWrapper .category-config-row, #adminCategoriesContainer .category-config-row");
      rows.forEach(function(r) {
        const nameInput = r.querySelector(".cat-name-input");
        const urlInput = r.querySelector(".cat-url-input");
        const nameVal = (nameInput ? nameInput.value : "").trim();
        const urlVal = (urlInput ? urlInput.value : "").trim();
        if (nameVal && nameVal.toLowerCase() !== "semua foto" && !nameVal.toLowerCase().includes("photobooth")) {
          list.push({ name: nameVal, url: urlVal, enabled: true });
        }
      });
      return list;
    }

    function syncCategoriesAndDisplayLinks() {
      const syncBtn = document.getElementById("btnSyncCategories");
      const customCategoriesList = getCategoriesFromAdminInputs();
      state.customCategories = customCategoriesList;
      state.activeConfig.CUSTOM_CATEGORIES = customCategoriesList;

      try {
        const cacheKey = state.currentEventId ? ("WEDDING_EVENT_CFG_" + state.currentEventId) : "WEDDING_ACTIVE_EVENT_CFG";
        localStorage.setItem(cacheKey, JSON.stringify(state.activeConfig));
        localStorage.setItem("WEDDING_SAVED_CUSTOM_CATEGORIES", JSON.stringify(customCategoriesList));
        localStorage.setItem("WEDDING_SAVED_CONFIG", JSON.stringify(state.activeConfig));
        localStorage.setItem("WEDDING_EVENTS_REGISTRY", JSON.stringify(state.events));
      } catch (e) {}

      renderCategoryTabs();
      applyCategoryFilter(state.activeCategory);

      if (syncBtn) {
        syncBtn.disabled = true;
        syncBtn.innerHTML = `<span>Menyinkronkan...</span>`;
      }

      if (state.gasApiUrl) {
        callBackend("saveAdminSettings", {
          pin: state.adminPin,
          config: { CUSTOM_CATEGORIES: customCategoriesList }
        }, function(res) {
          if (syncBtn) {
            syncBtn.disabled = false;
            syncBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg><span>Sinkronkan Kategori & Tautan</span>`;
          }
          showToast("✓ Kategori momen dan tautan display berhasil disinkronkan!");
        }, function(err) {
          if (syncBtn) {
            syncBtn.disabled = false;
            syncBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg><span>Sinkronkan Kategori & Tautan</span>`;
          }
          showToast("✓ Kategori momen dan tautan display tersimpan di browser!");
        });
      } else {
        if (syncBtn) {
          syncBtn.disabled = false;
          syncBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg><span>Sinkronkan Kategori & Tautan</span>`;
        }
        showToast("✓ Kategori momen dan tautan display tersimpan di browser!");
      }
    }

    /* ==========================================================================
       MANAJEMEN PENGGUNA ADMIN (MULTI-USER DENGAN PIN UNIK)
       ========================================================================== */
    function loadAdminUsers() {
      const container = document.getElementById("adminUsersList");
      if (!container) return;
      container.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 6px;">Memuat data pengguna...</div>`;

      callBackend("getAdminUsers", { pin: state.adminPin }, function(res) {
        if (res && res.success && Array.isArray(res.users)) {
          state.adminUsers = res.users;
          renderAdminUsersList(res.users);
        } else {
          const defaultList = [
            { id: "usr_superadmin", name: (state.currentAdminUser ? state.currentAdminUser.name : "Super Admin"), role: "Super Admin", pinMasked: "••••" }
          ];
          renderAdminUsersList(defaultList);
        }
      }, function() {
        const defaultList = [
          { id: "usr_superadmin", name: (state.currentAdminUser ? state.currentAdminUser.name : "Super Admin"), role: "Super Admin", pinMasked: "••••" }
        ];
        renderAdminUsersList(defaultList);
      });
    }

    function renderAdminUsersList(users) {
      const container = document.getElementById("adminUsersList");
      if (!container) return;
      if (!users || users.length === 0) {
        container.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 6px;">Belum ada pengguna tambahan.</div>`;
        return;
      }

      container.innerHTML = users.map(function(u) {
        const isCurrent = state.currentAdminUser && (state.currentAdminUser.id === u.id || state.currentAdminUser.name === u.name);
        return `
          <div style="display: flex; align-items: center; justify-content: space-between; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px 12px;">
            <div>
              <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                <span>${escapeHtml(u.name)}</span>
                ${isCurrent ? '<span style="font-size: 0.68rem; background: #DBEAFE; color: #1E40AF; padding: 1px 6px; border-radius: 9999px;">Anda</span>' : ''}
              </div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">
                Akses: Terproteksi PIN Unik &bull; Peran: ${escapeHtml(u.role || 'Admin')}
              </div>
            </div>
            ${!isCurrent && users.length > 1 ? `
              <button type="button" class="ctrl-icon-btn" style="width: 28px; height: 28px; border-color: #FECACA; color: #EF4444;" onclick="handleDeleteAdminUser('${escapeHtml(u.id)}')" title="Hapus Pengguna">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            ` : ''}
          </div>
        `;
      }).join("");
    }

    function handleAddAdminUser() {
      const nameInput = document.getElementById("newAdminNameInput");
      const pinInput = document.getElementById("newAdminPinInput");
      const alertBox = document.getElementById("addUserAlertBox");
      const addBtn = document.getElementById("btnAddAdminUserBtn");

      const name = (nameInput?.value || "").trim();
      const pin = (pinInput?.value || "").trim();

      if (!name) {
        if (alertBox) {
          alertBox.innerText = "Silakan masukkan nama admin.";
          alertBox.style.display = "block";
        }
        return;
      }
      if (!pin || pin.length < 4) {
        if (alertBox) {
          alertBox.innerText = "PIN minimal 4 karakter (angka/kombinasi unik).";
          alertBox.style.display = "block";
        }
        return;
      }

      if (alertBox) alertBox.style.display = "none";
      if (addBtn) addBtn.disabled = true;

      callBackend("addAdminUser", { pin: state.adminPin, newUser: { name: name, pin: pin, role: "Admin" } }, function(res) {
        if (addBtn) addBtn.disabled = false;
        if (res && res.success) {
          if (nameInput) nameInput.value = "";
          if (pinInput) pinInput.value = "";
          if (res.users) renderAdminUsersList(res.users);
          showToast("✓ " + (res.message || "Admin baru berhasil ditambahkan!"));
        } else {
          if (alertBox) {
            alertBox.innerText = (res && res.message) ? res.message : "Gagal menambahkan admin.";
            alertBox.style.display = "block";
          }
        }
      }, function(err) {
        if (addBtn) addBtn.disabled = false;
        if (alertBox) {
          alertBox.innerText = "Gangguan koneksi: " + err.message;
          alertBox.style.display = "block";
        }
      });
    }

    function handleDeleteAdminUser(userId) {
      if (!confirm("Yakin ingin menghapus pengguna admin ini?")) return;

      callBackend("deleteAdminUser", { pin: state.adminPin, targetUserId: userId }, function(res) {
        if (res && res.success) {
          if (res.users) renderAdminUsersList(res.users);
          showToast("✓ Pengguna admin berhasil dihapus.");
        } else {
          showToast("⚠️ " + (res && res.message ? res.message : "Gagal menghapus admin."));
        }
      }, function(err) {
        showToast("Gangguan: " + err.message);
      });
    }

    function closeAdminSettingsModal() {
      document.getElementById("adminSettingsModal").classList.remove("active");
      const floatBar = document.getElementById("adminActiveFloatingBar");
      if (floatBar && state.isAdminLoggedIn) {
        floatBar.style.display = "flex";
        const nameEl = document.getElementById("floatingBarAdminName");
        if (nameEl) nameEl.innerText = (state.currentAdminUser && state.currentAdminUser.name) ? state.currentAdminUser.name : "Admin";
      }
    }


    /* ==========================================================================
       WEDDING COVER SHOWCASE RENDERER (ROMANTIC IVORY & SOFT GOLD THEME)
       ========================================================================== */
    function renderWeddingCoverShowcase() {
      const container = document.getElementById("weddingCoverSection");
      if (!container) return;

      const cov = state.coverSettings || {};
      if (!cov || cov.enabled !== true) {
        container.style.display = "none";
        container.innerHTML = "";
        return;
      }

      container.style.display = "block";

      const heading = cov.heading || ("The Wedding of " + (state.activeConfig.EVENT_NAME || "Wilson & Felicia"));
      const subheading = cov.subheading || (state.activeConfig.SUBTITLE || "A Journey of Two Hearts Joined as One");
      const quote = cov.quote || "Di setiap langkah dan senyuman, terukir kisah cinta abadi yang kami rayakan bersama Anda.";
      const style = cov.style || "romantic-collage";

      // Foto-foto cover: prioritaskan daftar foto cover custom, fallback ke foto galeri pertama
      let photoList = (cov.photos && cov.photos.length > 0) ? cov.photos.slice() : [];
      if (photoList.length === 0 && Array.isArray(state.allPhotos) && state.allPhotos.length > 0) {
        photoList = state.allPhotos.slice(0, 4).map(function(p) {
          return p.previewUrl || p.thumbnailUrl || p.downloadUrl;
        }).filter(Boolean);
      }

      // Jika belum ada foto sama sekali, gunakan gambar bertema pernikahan lembut
      if (photoList.length === 0) {
        photoList = [
          "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80"
        ];
      }

      let layoutHtml = "";

      if (style === "hero-carousel") {
        // Layout 2: Hero Slider Sinematik
        let slidesHtml = "";
        let dotsHtml = "";
        photoList.forEach(function(url, idx) {
          slidesHtml += `
            <div class="cover-carousel-slide ${idx === 0 ? 'active' : ''}" data-index="${idx}">
              <img src="${escapeHtml(url)}" alt="Cover ${idx + 1}" loading="lazy">
            </div>
          `;
          dotsHtml += `<div class="carousel-dot ${idx === 0 ? 'active' : ''}" onclick="switchCoverCarouselSlide(${idx})"></div>`;
        });
        layoutHtml = `
          <div class="cover-carousel-layout" id="coverCarouselContainer">
            ${slidesHtml}
            <div class="cover-carousel-controls">${dotsHtml}</div>
          </div>
        `;
      } else if (style === "polaroid-grid") {
        // Layout 3: Polaroid Memory Board
        let polaroidsHtml = "";
        photoList.slice(0, 4).forEach(function(url, idx) {
          polaroidsHtml += `
            <div class="cover-polaroid-item">
              <img src="${escapeHtml(url)}" alt="Polaroid ${idx + 1}" loading="lazy">
              <div style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 0.88rem; font-style: italic; color: var(--gold-dark); text-align: center; margin-top: 10px;">
                Momen Indah #${idx + 1}
              </div>
            </div>
          `;
        });
        layoutHtml = `<div class="cover-polaroid-layout">${polaroidsHtml}</div>`;
      } else {
        // Layout 1: Romantic Wedding Collage (Default)
        const mainImg = photoList[0] || "";
        const sub1 = photoList[1] || photoList[0] || "";
        const sub2 = photoList[2] || photoList[1] || photoList[0] || "";

        layoutHtml = `
          <div class="cover-collage-layout">
            <div class="cover-photo-main">
              <img src="${escapeHtml(mainImg)}" alt="Foto Utama Pernikahan" loading="lazy">
            </div>
            <div class="cover-photo-side-stack">
              <div class="cover-photo-sub">
                <img src="${escapeHtml(sub1)}" alt="Foto Momen 1" loading="lazy">
              </div>
              <div class="cover-photo-sub">
                <img src="${escapeHtml(sub2)}" alt="Foto Momen 2" loading="lazy">
              </div>
            </div>
          </div>
        `;
      }

      container.innerHTML = `
        <div class="cover-card-container">
          <div class="cover-header-meta">
            <div class="cover-badge-top">💍 The Royal Celebration</div>
            <h2 class="cover-title">${escapeHtml(heading)}</h2>
            <div class="cover-subheading">${escapeHtml(subheading)}</div>
            <div class="cover-quote">“${escapeHtml(quote)}”</div>
          </div>

          ${layoutHtml}

          </div>
      `;

      if (style === "hero-carousel" && photoList.length > 1) {
        startCoverCarouselAutoPlay();
      }
    }

    let coverCarouselTimer = null;
    function startCoverCarouselAutoPlay() {
      if (coverCarouselTimer) clearInterval(coverCarouselTimer);
      coverCarouselTimer = setInterval(function() {
        const slides = document.querySelectorAll(".cover-carousel-slide");
        if (slides.length <= 1) return;
        let curIdx = 0;
        slides.forEach(function(s, idx) {
          if (s.classList.contains("active")) curIdx = idx;
        });
        const nextIdx = (curIdx + 1) % slides.length;
        switchCoverCarouselSlide(nextIdx);
      }, 4500);
    }

    function switchCoverCarouselSlide(targetIdx) {
      const slides = document.querySelectorAll(".cover-carousel-slide");
      const dots = document.querySelectorAll(".carousel-dot");
      slides.forEach(function(s, idx) {
        if (idx === targetIdx) s.classList.add("active");
        else s.classList.remove("active");
      });
      dots.forEach(function(d, idx) {
        if (idx === targetIdx) d.classList.add("active");
        else d.classList.remove("active");
      });
    }

    function scrollToGallerySection() {
      const el = document.getElementById("gallerySection");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }

    /* ==========================================================================
       SHARE & QR CODE MODAL FUNCTIONS
       ========================================================================== */
        function formatDayDateIndonesian(val) {
      if (!val) return "Senin, 16 November 2026";
      const cleanStr = String(val).replace(/\s+\d{2}:\d{2}:\d{2}.*$/, '').replace(/GMT.*$/, '').trim();
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      const monthMap = { 'januari':0,'februari':1,'maret':2,'april':3,'mei':4,'juni':5,'juli':6,'agustus':7,'september':8,'oktober':9,'november':10,'desember':11 };
      
      const dMatch = cleanStr.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
      if (dMatch) {
        const dNum = parseInt(dMatch[1], 10);
        const mIdx = monthMap[dMatch[2].toLowerCase()];
        const yNum = parseInt(dMatch[3], 10);
        if (mIdx !== undefined) {
          const dt = new Date(yNum, mIdx, dNum);
          return days[dt.getDay()] + ", " + String(dNum).padStart(2, "0") + " " + months[mIdx] + " " + yNum;
        }
      }
      const dt2 = new Date(cleanStr);
      if (!isNaN(dt2.getTime())) {
        return days[dt2.getDay()] + ", " + String(dt2.getDate()).padStart(2, "0") + " " + months[dt2.getMonth()] + " " + dt2.getFullYear();
      }
      return cleanStr;
    }

    function openShareModal() {
      const modal = document.getElementById("shareQrModal");
      if (!modal) return;

      const titleEl = document.getElementById("shareEventTitle");
      if (titleEl) {
        titleEl.innerText = state.activeConfig.EVENT_NAME || "Wilson & Felicia";
      }

      const subEl = document.getElementById("shareEventSubtitle");
      if (subEl) {
        const formattedDate = formatDayDateIndonesian(state.activeConfig.EVENT_DATE || "16 November 2026");
        const venue = (state.activeConfig.EVENT_VENUE || "").trim();
        if (venue) {
          subEl.innerHTML = '<div style="font-weight: 600; color: var(--gold-dark);">' + escapeHtml(formattedDate) + '</div><div style="font-size: 0.78rem; opacity: 0.88; margin-top: 4px; color: var(--text-main);">' + escapeHtml(venue) + '</div>';
        } else {
          subEl.innerText = formattedDate;
        }
      }

      // Bentuk URL lengkap event aktif
      const curOrigin = window.location.origin || (window.location.protocol + "//" + window.location.host);
      const curPath = window.location.pathname || "/";
      const eventParam = state.currentEventId ? ("?event=" + encodeURIComponent(state.currentEventId)) : "";
      const fullUrl = curOrigin + curPath + eventParam;

      const urlInput = document.getElementById("shareUrlInput");
      if (urlInput) urlInput.value = fullUrl;

      // Buat QR Code resolusi tinggi menggunakan QR API
      const qrImg = document.getElementById("shareQrImg");
      if (qrImg) {
        qrImg.src = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=" + encodeURIComponent(fullUrl);
      }

      modal.classList.add("active");
    }

    function closeShareModal() {
      const modal = document.getElementById("shareQrModal");
      if (modal) modal.classList.remove("active");
    }

    function copyShareUrl() {
      const urlInput = document.getElementById("shareUrlInput");
      const val = urlInput ? urlInput.value : window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(val).then(function() {
          showToast("✓ Tautan galeri berhasil disalin ke clipboard!");
        }).catch(function() {
          fallbackCopyText(val);
        });
      } else {
        fallbackCopyText(val);
      }
    }

    function fallbackCopyText(text) {
      const t = document.createElement("textarea");
      t.value = text;
      document.body.appendChild(t);
      t.select();
      try {
        document.execCommand("copy");
        showToast("✓ Tautan berhasil disalin!");
      } catch (e) {}
      document.body.removeChild(t);
    }

    function shareViaWhatsApp() {
      const urlInput = document.getElementById("shareUrlInput");
      const targetUrl = urlInput ? urlInput.value : window.location.href;
      const eventName = state.activeConfig.EVENT_NAME || "Pernikahan";
      const text = encodeURIComponent("Mari rayakan momen bahagia " + eventName + "! Lihat dan unduh foto kenangan selengkapnya di:\n" + targetUrl);
      window.open("https://api.whatsapp.com/send?text=" + text, "_blank");
    }

    function shareViaWebShare() {
      const urlInput = document.getElementById("shareUrlInput");
      const targetUrl = urlInput ? urlInput.value : window.location.href;
      const eventName = state.activeConfig.EVENT_NAME || "Pernikahan";
      if (navigator.share) {
        navigator.share({
          title: eventName + " - Wedding Photo Gallery",
          text: "Lihat dan unduh foto kenangan bahagia kami di galeri pernikahan:",
          url: targetUrl
        }).catch(function() {});
      } else {
        copyShareUrl();
      }
    }

    function downloadQrCodeImage() {
      const qrImg = document.getElementById("shareQrImg");
      if (!qrImg || !qrImg.src) return;
      const eventName = (state.activeConfig.EVENT_NAME || "Wedding").replace(/[^a-zA-Z0-9]/g, "_");
      
      // Unduh langsung gambar QR
      fetch(qrImg.src)
        .then(res => res.blob())
        .then(blob => {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "QR_Galeri_" + eventName + ".png";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          showToast("✓ Gambar QR Code berhasil diunduh!");
        })
        .catch(() => {
          window.open(qrImg.src, "_blank");
        });
    }

    /* ==========================================================================
       MULTI-EVENT ADMIN MANAGEMENT FUNCTIONS
       ========================================================================== */
    function renderAdminEventsManager() {
      const select = document.getElementById("adminEventSelect");
      if (!select) return;

      select.innerHTML = "";
      if (!Array.isArray(state.events) || state.events.length === 0) {
        state.events = [
          {
            id: state.currentEventId || "wilson-felicia",
            name: state.activeConfig.EVENT_NAME || "Wilson & Felicia",
            date: state.activeConfig.EVENT_DATE || "14 November 2026",
            venue: state.activeConfig.EVENT_VENUE || "Makassar"
          }
        ];
      }

      state.events.forEach(function(ev) {
        const opt = document.createElement("option");
        opt.value = ev.id;
        opt.innerText = (ev.name || ev.id) + " (" + (ev.date || "") + ")";
        if (ev.id === state.currentEventId) opt.selected = true;
        select.appendChild(opt);
      });

      const previewEl = document.getElementById("activeEventUrlPreview");
      if (previewEl) {
        previewEl.innerText = "?event=" + state.currentEventId;
      }
    }

    function handleSelectEventChange(selectedId) {
      if (!selectedId || selectedId === state.currentEventId) return;
      state.currentEventId = selectedId;

      const ev = state.events.find(function(e) { return e.id === selectedId; });
      if (ev) {
        state.activeConfig = Object.assign({}, state.activeConfig, {
          EVENT_NAME: ev.name,
          COUPLE_NAME: ev.name,
          EVENT_DATE: ev.date,
          EVENT_VENUE: ev.venue,
          SUBTITLE: ev.subtitle || "",
          WELCOME_MESSAGE: ev.welcomeMessage || "",
          FOOTER_MESSAGE: ev.footerMessage || "",
          ALL_PHOTOS_LABEL: ev.allPhotosLabel || "Semua Foto",
          DRIVE_FOLDER_ID: ev.driveFolderId || "",
          FRAME_IMAGE_URL: ev.frameImageUrl || "",
          CUSTOM_CATEGORIES: ev.customCategories || [],
          COVER_SETTINGS: ev.coverSettings || null
        });
        state.customCategories = ev.customCategories || [];
        state.allPhotosLabel = ev.allPhotosLabel || "Semua Foto";
        state.coverSettings = ev.coverSettings || null;

        // Perbarui input form admin seketika
        populateAdminInputsForActiveEvent(state.activeConfig);
        populateConfigToUI(state.activeConfig);
        renderCategoryTabs();
        renderAdminCoverManager();
        renderAdminCategoriesManager();

        // Ganti parameter URL tanpa reload halaman
        try {
          const newUrl = window.location.pathname + "?event=" + encodeURIComponent(selectedId);
          window.history.replaceState({ eventId: selectedId }, "", newUrl);
        } catch (e) {}

        const previewEl = document.getElementById("activeEventUrlPreview");
        if (previewEl) previewEl.innerText = "?event=" + selectedId;

        // Ambil data foto untuk event yang dipilih
        fetchGalleryData(true, false);
        showToast("✓ Berpindah ke event: " + (ev.name || selectedId));
      }
    }

    function populateAdminInputsForActiveEvent(cfg) {
      const cfgCoupleEl = document.getElementById("cfgCoupleName");
      if (cfgCoupleEl) cfgCoupleEl.value = cfg.EVENT_NAME || "";
      const cfgDateEl = document.getElementById("cfgEventDate");
      if (cfgDateEl) cfgDateEl.value = formatDateForInput(cfg.EVENT_DATE);
      const cfgVenueEl = document.getElementById("cfgEventVenue");
      if (cfgVenueEl) cfgVenueEl.value = cfg.EVENT_VENUE || "";
      const cfgAllPhotosLabelEl = document.getElementById("cfgAllPhotosLabel");
      if (cfgAllPhotosLabelEl) cfgAllPhotosLabelEl.value = cfg.ALL_PHOTOS_LABEL || "Semua Foto";
      const cfgSubtitleEl = document.getElementById("cfgSubtitle");
      if (cfgSubtitleEl) cfgSubtitleEl.value = cfg.SUBTITLE || "";
      const cfgWelcomeEl = document.getElementById("cfgWelcomeMessage");
      if (cfgWelcomeEl) cfgWelcomeEl.value = cfg.WELCOME_MESSAGE || "";
      const cfgFooterEl = document.getElementById("cfgFooterMessage");
      if (cfgFooterEl) cfgFooterEl.value = cfg.FOOTER_MESSAGE || "";
      const cfgDriveEl = document.getElementById("cfgDriveFolderId");
      if (cfgDriveEl) cfgDriveEl.value = cfg.DRIVE_FOLDER_ID || "";
      const cfgFrameEl = document.getElementById("cfgFrameImageUrl");
      if (cfgFrameEl) cfgFrameEl.value = cfg.FRAME_IMAGE_URL || "";
    }

    function promptAddNewEvent() {
      const name = prompt("Masukkan Nama Event / Pasangan Baru (misal: Romeo & Juliet):");
      if (!name || !name.trim()) return;

      const dateStr = prompt("Masukkan Tanggal Acara (misal: 25 Desember 2026):", "25 Desember 2026");
      const venueStr = prompt("Masukkan Venue / Lokasi Acara:", "Grand Ballroom, Jakarta");

      const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const newId = slug ? (slug + "-" + Math.floor(100 + Math.random() * 900)) : ("event-" + Date.now());

      const newEventObj = {
        id: newId,
        name: name.trim(),
        date: dateStr ? dateStr.trim() : "25 Desember 2026",
        venue: venueStr ? venueStr.trim() : "Grand Ballroom",
        subtitle: "The Wedding Celebration",
        welcomeMessage: "Terima kasih atas kehadiran dan doa restu Anda.",
        footerMessage: "Diabadikan dengan cinta\nTerima kasih atas doa restunya.",
        allPhotosLabel: "Semua Foto",
        driveFolderId: "",
        frameImageUrl: "",
        customCategories: [],
        coverSettings: {
          enabled: true,
          style: "romantic-collage",
          heading: "The Wedding of " + name.trim(),
          subheading: "A Celebration of Love, Laughter & Happily Ever After",
          quote: "Dua hati yang bersatu dalam cinta mengukir kisah abadi.",
          photos: []
        }
      };

      if (!Array.isArray(state.events)) state.events = [];
      state.events.push(newEventObj);

      renderAdminEventsManager();
      handleSelectEventChange(newId);
      showToast("✓ Event baru '" + name.trim() + "' berhasil dibuat!");
    }

    function handleDeleteCurrentEvent() {
      if (!Array.isArray(state.events) || state.events.length <= 1) {
        showToast("⚠️ Tidak dapat menghapus event karena hanya ada 1 event tersisa.");
        return;
      }

      if (!confirm("Yakin ingin menghapus event '" + (state.activeConfig.EVENT_NAME || state.currentEventId) + "'?")) return;

      const deleteId = state.currentEventId;
      state.events = state.events.filter(function(e) { return e.id !== deleteId; });
      const nextEvent = state.events[0];
      handleSelectEventChange(nextEvent.id);
      renderAdminEventsManager();
      showToast("✓ Event berhasil dihapus.");
    }

    function copyActiveEventUrl() {
      const curOrigin = window.location.origin || (window.location.protocol + "//" + window.location.host);
      const curPath = window.location.pathname || "/";
      const fullUrl = curOrigin + curPath + "?event=" + encodeURIComponent(state.currentEventId);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullUrl).then(function() {
          showToast("✓ Tautan event aktif berhasil disalin!");
        }).catch(function() {
          fallbackCopyText(fullUrl);
        });
      } else {
        fallbackCopyText(fullUrl);
      }
    }

    /* ==========================================================================
       COVER & DESAIN HALAMAN DEPAN ADMIN FUNCTIONS
       ========================================================================== */
    function renderAdminCoverManager() {
      const cov = state.coverSettings || {};
      const enabledBox = document.getElementById("cfgCoverEnabled");
      if (enabledBox) enabledBox.checked = cov.enabled !== false;

      const styleSel = document.getElementById("cfgCoverStyle");
      if (styleSel) styleSel.value = cov.style || "romantic-collage";

      const headInp = document.getElementById("cfgCoverHeading");
      if (headInp) headInp.value = cov.heading || "";

      const subInp = document.getElementById("cfgCoverSubheading");
      if (subInp) subInp.value = cov.subheading || "";

      const quoteInp = document.getElementById("cfgCoverQuote");
      if (quoteInp) quoteInp.value = cov.quote || "";

      const container = document.getElementById("coverPhotosListContainer");
      if (!container) return;
      container.innerHTML = "";

      const photos = Array.isArray(cov.photos) ? cov.photos : [];
      photos.forEach(function(url) {
        addCoverPhotoRow(url);
      });
    }

    function addCoverPhotoRow(url) {
      const container = document.getElementById("coverPhotosListContainer");
      if (!container) return;

      const row = document.createElement("div");
      row.className = "cover-photo-row";
      row.style.cssText = "display: flex; gap: 8px; align-items: center; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 8px 10px; border-radius: 8px;";
      row.innerHTML = `
        <input type="text" class="admin-input cover-photo-url-input" value="${escapeHtml(url || '')}" placeholder="Tautan Foto (Google Drive / Direct Image URL)" style="flex: 1; padding: 6px 10px; font-size: 0.82rem;">
        <button type="button" class="ctrl-icon-btn" onclick="removeCoverPhotoRow(this)" title="Hapus Foto" style="width: 30px; height: 30px; color: #EF4444; border-color: #FECACA; background: #FFF;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      `;
      container.appendChild(row);
    }

    function removeCoverPhotoRow(btn) {
      const row = btn.closest(".cover-photo-row");
      if (row) row.remove();
    }

    function getCoverPhotosFromAdminInputs() {
      const rows = document.querySelectorAll("#coverPhotosListContainer .cover-photo-url-input");
      const list = [];
      rows.forEach(function(inp) {
        const val = (inp.value || "").trim();
        if (val) list.push(val);
      });
      return list;
    }

    function toggleCoverSectionPreview(enabled) {
      if (!state.coverSettings) state.coverSettings = {};
      state.coverSettings.enabled = enabled;
      renderWeddingCoverShowcase();
    }

    /* ==========================================================================
       ADMIN USER & PASSWORD MANAGEMENT
       ========================================================================== */
    function loadAdminUsers() {
      callBackend("getAdminUsers", { pin: state.adminPin }, function(res) {
        if (res && res.success && res.users) {
          state.adminAccounts = res.users;
          renderAdminUsersList(res.users);
        } else {
          // Render fallback lokal akun
          const accounts = state.adminAccounts || [
            { id: "usr_superadmin", username: "admin", name: "Super Admin", role: "Super Admin" }
          ];
          renderAdminUsersList(accounts);
        }
      }, function() {
        const accounts = state.adminAccounts || [
          { id: "usr_superadmin", username: "admin", name: "Super Admin", role: "Super Admin" }
        ];
        renderAdminUsersList(accounts);
      });
    }

    function renderAdminUsersList(users) {
      const listEl = document.getElementById("adminUsersList");
      if (!listEl) return;
      listEl.innerHTML = "";

      if (!Array.isArray(users) || users.length === 0) {
        listEl.innerHTML = "<div style='font-size: 0.78rem; color: #94A3B8;'>Belum ada data admin lain.</div>";
        return;
      }

      users.forEach(function(u) {
        const row = document.createElement("div");
        row.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: #fff; border: 1px solid #E2E8F0; padding: 8px 12px; border-radius: 8px; font-size: 0.8rem;";
        const isSelf = state.currentAdminUser && (state.currentAdminUser.username === u.username || state.currentAdminUser.id === u.id);
        const delBtn = isSelf ? "<span style='font-size: 0.72rem; color: #10B981; font-weight: 600;'>Akun Anda</span>" : `
          <button type="button" class="ctrl-icon-btn" onclick="handleDeleteAdminUser('${u.id || u.username}')" title="Hapus Akun" style="width: 26px; height: 26px; color: #EF4444; border-color: #FECACA;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
            </svg>
          </button>
        `;

        row.innerHTML = `
          <div>
            <div style="font-weight: 600; color: var(--text-main);">${escapeHtml(u.name || u.username || 'Admin')}</div>
            <div style="font-size: 0.72rem; color: #64748B;">Username: <strong>${escapeHtml(u.username || 'admin')}</strong> • ${escapeHtml(u.role || 'Admin')}</div>
          </div>
          <div>${delBtn}</div>
        `;
        listEl.appendChild(row);
      });
    }

    function handleChangeAdminPassword() {
      const passInp = document.getElementById("cfgNewAdminPassword");
      const alertBox = document.getElementById("changePassAlertBox");
      const newPass = (passInp ? passInp.value : "").trim();

      if (!newPass || newPass.length < 4) {
        if (alertBox) {
          alertBox.className = "admin-alert-box error";
          alertBox.innerText = "Password baru minimal 4 karakter.";
          alertBox.style.display = "block";
        }
        return;
      }

      state.adminPin = newPass;
      if (state.currentAdminUser) {
        state.currentAdminUser.password = newPass;
      }
      if (passInp) passInp.value = "";
      if (alertBox) {
        alertBox.className = "admin-alert-box success";
        alertBox.innerText = "✓ Password berhasil diperbarui!";
        alertBox.style.display = "block";
      }
      showToast("✓ Password Admin berhasil diganti!");

      callBackend("changeAdminPin", { currentPin: state.adminPin, newPin: newPass });
    }

    function handleAddAdminUser() {
      const uInp = document.getElementById("newAdminUsernameInput");
      const nInp = document.getElementById("newAdminNameInput");
      const pInp = document.getElementById("newAdminPasswordInput");
      const alertBox = document.getElementById("addUserAlertBox");

      const uVal = (uInp ? uInp.value : "").trim();
      const nVal = (nInp ? nInp.value : "").trim();
      const pVal = (pInp ? pInp.value : "").trim();

      if (!uVal || !pVal) {
        if (alertBox) {
          alertBox.innerText = "Username dan Password wajib diisi.";
          alertBox.style.display = "block";
        }
        return;
      }

      const newUser = {
        id: "usr_" + Date.now(),
        username: uVal,
        name: nVal || uVal,
        password: pVal,
        pin: pVal,
        role: "Admin",
        createdAt: new Date().toISOString()
      };

      if (!Array.isArray(state.adminAccounts)) state.adminAccounts = [];
      state.adminAccounts.push(newUser);

      if (uInp) uInp.value = "";
      if (nInp) nInp.value = "";
      if (pInp) pInp.value = "";
      if (alertBox) alertBox.style.display = "none";

      renderAdminUsersList(state.adminAccounts);
      showToast("✓ Akun admin '" + uVal + "' berhasil ditambahkan!");

      callBackend("addAdminUser", { pin: state.adminPin, newUser: newUser });
    }

    function handleSaveAllSettings() {
      const saveBtn = document.getElementById("btnSaveSettings");
      const alertBox = document.getElementById("saveAlertBox");

      const newApiUrl = (document.getElementById("cfgGasApiUrl")?.value || "").trim();
      const driveFolderInput = (document.getElementById("cfgDriveFolderId")?.value || "").trim();
      const eventNameInput = (document.getElementById("cfgCoupleName")?.value || "").trim();
      const eventDateInput = (document.getElementById("cfgEventDate")?.value || "").trim();
      const eventVenueInput = (document.getElementById("cfgEventVenue")?.value || "").trim();
      const subtitleInput = (document.getElementById("cfgSubtitle")?.value || "").trim();
      const welcomeInput = (document.getElementById("cfgWelcomeMessage")?.value || "").trim();
      const footerInput = (document.getElementById("cfgFooterMessage")?.value || "").trim();
      const customCategoriesList = getCategoriesFromAdminInputs();
      const frameUrlInput = (document.getElementById("cfgFrameImageUrl")?.value || "").trim();
      const newPinInput = (document.getElementById("cfgNewPin")?.value || "").trim();

      state.gasApiUrl = newApiUrl;
      if (newApiUrl) {
        localStorage.setItem("WEDDING_GAS_API_URL", newApiUrl);
      }

      // Format tanggal ke format bahasa Indonesia untuk display dan penyimpanan
      const formattedDate = eventDateInput ? formatIndonesianDate(eventDateInput) : (state.activeConfig.EVENT_DATE || "14 November 2026");
      const finalEventName = eventNameInput || state.activeConfig.EVENT_NAME || "Wilson & Felicia";

      const allPhotosLabelInput = (document.getElementById("cfgAllPhotosLabel")?.value || "").trim() || "Semua Foto";
      const coverEnabledInput = document.getElementById("cfgCoverEnabled") ? document.getElementById("cfgCoverEnabled").checked : true;
      const coverStyleInput = (document.getElementById("cfgCoverStyle")?.value || "romantic-collage");
      const coverHeadingInput = (document.getElementById("cfgCoverHeading")?.value || "").trim();
      const coverSubheadingInput = (document.getElementById("cfgCoverSubheading")?.value || "").trim();
      const coverQuoteInput = (document.getElementById("cfgCoverQuote")?.value || "").trim();
      const coverPhotosInput = getCoverPhotosFromAdminInputs();

      const coverSettingsPayload = {
        enabled: coverEnabledInput,
        style: coverStyleInput,
        heading: coverHeadingInput || ("The Wedding of " + finalEventName),
        subheading: coverSubheadingInput || "A Celebration of Love, Laughter & Happily Ever After",
        quote: coverQuoteInput || "Di setiap langkah dan senyuman, terukir kisah cinta abadi yang kami rayakan bersama Anda.",
        photos: coverPhotosInput
      };

      state.allPhotosLabel = allPhotosLabelInput;
      state.coverSettings = coverSettingsPayload;

      // Perbarui data event aktif di daftar events
      if (Array.isArray(state.events)) {
        const evIdx = state.events.findIndex(function(e) { return e.id === state.currentEventId; });
        if (evIdx >= 0) {
          state.events[evIdx] = Object.assign({}, state.events[evIdx], {
            name: finalEventName,
            date: formattedDate,
            venue: eventVenueInput || state.events[evIdx].venue,
            subtitle: subtitleInput || state.events[evIdx].subtitle,
            welcomeMessage: welcomeInput || state.events[evIdx].welcomeMessage,
            footerMessage: footerInput || state.events[evIdx].footerMessage,
            allPhotosLabel: allPhotosLabelInput,
            driveFolderId: driveFolderInput,
            frameImageUrl: frameUrlInput,
            customCategories: customCategoriesList,
            coverSettings: coverSettingsPayload
          });
        }
      }

      const payload = {
        ACTIVE_EVENT_ID: state.currentEventId,
        EVENT_NAME: finalEventName,
        COUPLE_NAME: finalEventName,
        EVENT_DATE: formattedDate,
        EVENT_VENUE: eventVenueInput || state.activeConfig.EVENT_VENUE || "Upperhills Convention Centre, Makassar",
        SUBTITLE: subtitleInput || state.activeConfig.SUBTITLE || "The Wedding Gallery & Precious Memories",
        WELCOME_MESSAGE: welcomeInput || state.activeConfig.WELCOME_MESSAGE || "Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.",
        FOOTER_MESSAGE: footerInput || state.activeConfig.FOOTER_MESSAGE || "Diabadikan dengan cinta\nTerima kasih atas doa restunya.",
        ALL_PHOTOS_LABEL: allPhotosLabelInput,
        CUSTOM_CATEGORIES: JSON.stringify(customCategoriesList),
        COVER_SETTINGS: coverSettingsPayload,
        EVENTS: state.events,
        DRIVE_FOLDER_ID: driveFolderInput,
        FRAME_IMAGE_URL: frameUrlInput,
        GAS_API_URL: newApiUrl,
        ADMIN_USERNAME: (state.currentAdminUser ? state.currentAdminUser.username : state.adminUsername) || "admin",
        NEW_PIN: newPinInput
      };

      state.activeConfig = Object.assign({}, state.activeConfig, payload);
      state.customCategories = customCategoriesList;
      try {
        localStorage.setItem("WEDDING_SAVED_CUSTOM_CATEGORIES", JSON.stringify(customCategoriesList));
        localStorage.setItem("WEDDING_SAVED_CONFIG", JSON.stringify(state.activeConfig));
      } catch (e) {}

      // Langsung perbarui tampilan visual seketika (Instant UI Update)
      populateConfigToUI(state.activeConfig);
      renderCategoryTabs();

      saveBtn.disabled = true;
      saveBtn.innerHTML = `<span>Menyimpan Pengaturan...</span>`;
      if (alertBox) alertBox.style.display = "none";

      if (state.gasApiUrl) {
        // Kirim langsung ke Google Apps Script (yang otomatis menyimpan ke Properties & Spreadsheet 'foto-panggung')
        callBackend("saveAdminSettings", { pin: state.adminPin, config: payload }, function(res) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = `<polyline points="20 6 9 17 4 12"></polyline><span>Simpan Perubahan</span>`;
          if (payload.NEW_PIN) {
            state.adminPin = payload.NEW_PIN;
            const newPinEl = document.getElementById("cfgNewPin");
            if (newPinEl) newPinEl.value = "";
          }
          if (res && res.galleryData && res.galleryData.config) {
            res.galleryData.config = Object.assign({}, res.galleryData.config, payload);
            handleGalleryResponse(res.galleryData, false);
          }
          if (res && !res.success) {
            showToast("⚠️ " + (res.message || "Gagal menyimpan ke Google Spreadsheet. Pengaturan disimpan di browser."));
          } else {
            showToast("✓ Pengaturan & Kustomisasi Acara berhasil disimpan!");
          }
          closeAdminSettingsModal();
        }, function(err) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = `<polyline points="20 6 9 17 4 12"></polyline><span>Simpan Perubahan</span>`;
          showToast("✓ Pengaturan berhasil disimpan di browser!");
          closeAdminSettingsModal();
        });
      } else {
        // Jika URL Apps Script belum diisi
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<polyline points="20 6 9 17 4 12"></polyline><span>Simpan Perubahan</span>`;
        showToast("✓ Pengaturan berhasil disimpan di browser!");
        closeAdminSettingsModal();
      }
    }

    function handleAdminLogout() {
      state.isAdminLoggedIn = false;
      state.adminPin = "";
      const floatBar = document.getElementById("adminActiveFloatingBar");
      if (floatBar) floatBar.style.display = "none";
      updateAdminButtonUI(false);
      closeAdminSettingsModal();
      showToast("Anda telah keluar dari mode admin.");
    }

    function handleSyncDrivePhotosDirectly() {
      const driveInput = (document.getElementById("cfgDriveFolderId")?.value || "").trim();
      if (!driveInput) {
        showToast("⚠️ Masukkan Tautan atau ID Folder Google Drive terlebih dahulu.");
        return;
      }

      const btn = document.getElementById("btnSyncDrivePhotos");
      const btnText = document.getElementById("syncDriveBtnText");
      const btnIcon = document.getElementById("syncDriveBtnIcon");

      if (btn) btn.disabled = true;
      if (btnText) btnText.innerText = "Memindai & Menyinkronkan...";
      if (btnIcon) btnIcon.classList.add("spin");

      callBackend("testAndSyncDriveFolder", { pin: state.adminPin, folderId: driveInput }, function(res) {
        if (btn) btn.disabled = false;
        if (btnText) btnText.innerText = "🔄 Sinkronkan Foto Google Drive ke Galeri";
        if (btnIcon) btnIcon.classList.remove("spin");

        if (res && res.success) {
          state.activeConfig.DRIVE_FOLDER_ID = driveInput;
          showToast("✓ " + (res.message || "Foto Google Drive berhasil disinkronkan ke galeri!"));
          if (res.galleryData) {
            handleGalleryResponse(res.galleryData, false);
          } else {
            fetchGalleryData(true);
          }
        } else {
          showToast("⚠️ " + (res.message || "Gagal menyinkronkan folder Google Drive."));
        }
      }, function(err) {
        if (btn) btn.disabled = false;
        if (btnText) btnText.innerText = "🔄 Sinkronkan Foto Google Drive ke Galeri";
        if (btnIcon) btnIcon.classList.remove("spin");
        showToast("Gangguan koneksi: " + err.message);
      });
    }

    /* ==========================================================================
       CANVAS COMPOSITOR: TEMPEL BINGKAI FOTO KUSTOM SAAT DOWNLOAD
       ========================================================================== */
    function normalizeDriveImageUrl(urlOrId) {
      if (!urlOrId) return "";
      const raw = String(urlOrId).trim();

      const match = raw.match(/\/d\/([a-zA-Z0-9_\-]+)/) || raw.match(/id=([a-zA-Z0-9_\-]+)/);
      if (match && match[1]) {
        return "https://drive.google.com/thumbnail?id=" + match[1] + "&sz=w2500";
      }

      if (/^[a-zA-Z0-9_\-]{20,}$/.test(raw) && !raw.startsWith("http")) {
        return "https://drive.google.com/thumbnail?id=" + raw + "&sz=w2500";
      }

      return raw;
    }

    // ==========================================================================
    // BACKGROUND ASYNCHRONOUS DOWNLOAD QUEUE & HIGH-RES ENGINE
    // ==========================================================================
    const downloadQueue = {
      items: [],
      currentPhoto: null,
      isProcessing: false,
      hideTimer: null
    };

    function dismissDownloadWidget() {
      const widget = document.getElementById("downloadProgressWidget");
      if (widget) widget.classList.remove("active");
    }

    function updateDownloadWidget(percent, title, subtitle, isComplete) {
      const widget = document.getElementById("downloadProgressWidget");
      const titleEl = document.getElementById("dpwTitle");
      const subtitleEl = document.getElementById("dpwSubtitle");
      const fillEl = document.getElementById("dpwProgressFill");
      const badgeEl = document.getElementById("dpwBadge");
      const spinnerEl = document.getElementById("dpwIconSpinner");
      const checkEl = document.getElementById("dpwIconCheck");

      if (!widget) return;

      if (downloadQueue.hideTimer) {
        clearTimeout(downloadQueue.hideTimer);
        downloadQueue.hideTimer = null;
      }

      widget.classList.add("active");
      if (title && titleEl) titleEl.innerText = title;
      if (subtitle && subtitleEl) subtitleEl.innerText = subtitle;
      if (fillEl) fillEl.style.width = Math.min(100, Math.max(5, percent)) + "%";

      const remaining = downloadQueue.items.length + (downloadQueue.isProcessing ? 1 : 0);

      if (isComplete) {
        if (badgeEl) badgeEl.innerText = "Selesai";
        if (spinnerEl) spinnerEl.style.display = "none";
        if (checkEl) checkEl.style.display = "block";
        if (fillEl) fillEl.style.width = "100%";

        downloadQueue.hideTimer = setTimeout(function() {
          widget.classList.remove("active");
          setTimeout(function() {
            if (spinnerEl) spinnerEl.style.display = "block";
            if (checkEl) checkEl.style.display = "none";
          }, 400);
        }, 2500);
      } else {
        if (badgeEl) {
          if (remaining > 1) {
            badgeEl.innerText = remaining + " Antrean";
          } else {
            badgeEl.innerText = "1 Unduhan";
          }
        }
        if (spinnerEl) spinnerEl.style.display = "block";
        if (checkEl) checkEl.style.display = "none";
      }
    }

    function downloadCurrentPhotoWithFrame() {
      const photo = state.filteredPhotos[state.currentLightboxIndex];
      if (!photo) return;

      // JAMINAN MUTLAK: Kategori khusus Photobooth SELALU diunduh ukuran aslinya tanpa kompresi dan tanpa bingkai!
      const isPhotobooth = Boolean(
        photo.isVideo ||
        photo.isKing ||
        photo.isPhotobooth ||
        (photo.category && photo.category.toLowerCase().includes("photobooth")) ||
        (state.activeCategory && state.activeCategory.toLowerCase().includes("photobooth")) ||
        (photo.downloadUrl && (photo.downloadUrl.includes("kingphotobooth.co") || photo.downloadUrl.includes("fotoshare.co") || photo.downloadUrl.includes("photos.google.com"))) ||
        (photo.previewUrl && (photo.previewUrl.includes("kingphotobooth.co") || photo.previewUrl.includes("fotoshare.co") || photo.previewUrl.includes("photos.google.com")))
      );

      if (isPhotobooth) {
        downloadPhotoboothOriginal(photo);
        return;
      }

      // Cek apakah foto ini sudah ada dalam antrean atau sedang diproses
      const isAlreadyQueued = downloadQueue.items.some(function(item) {
        return (item.id && photo.id && item.id === photo.id) || (item.name && photo.name && item.name === photo.name);
      });
      const isCurrentProcessing = downloadQueue.currentPhoto && (
        (downloadQueue.currentPhoto.id && photo.id && downloadQueue.currentPhoto.id === photo.id) ||
        (downloadQueue.currentPhoto.name && photo.name && downloadQueue.currentPhoto.name === photo.name)
      );

      const btnLabel = document.getElementById("downloadBtnLabel");
      if (isAlreadyQueued || isCurrentProcessing) {
        if (btnLabel) {
          const prev = btnLabel.innerText;
          btnLabel.innerText = "✓ Sudah Dalam Antrean";
          setTimeout(function() {
            if (btnLabel && btnLabel.innerText === "✓ Sudah Dalam Antrean") btnLabel.innerText = prev;
          }, 1500);
        }
        showToast("Foto ini sudah ada dalam antrean unduh.");
        return;
      }

      // Berikan umpan balik instan pada tombol unduh tanpa memblokir tombol berikutnya
      if (btnLabel) {
        const prevText = btnLabel.innerText;
        btnLabel.innerText = "✓ Masuk Antrean Unduh";
        setTimeout(function() {
          if (btnLabel && btnLabel.innerText === "✓ Masuk Antrean Unduh") {
            btnLabel.innerText = prevText;
          }
        }, 1500);
      }

      // Masukkan ke antrean unduh latar belakang (non-blocking, bebas swipe foto lain)
      downloadQueue.items.push(photo);

      const remaining = downloadQueue.items.length + (downloadQueue.isProcessing ? 1 : 0);

      if (downloadQueue.isProcessing) {
        const badgeEl = document.getElementById("dpwBadge");
        if (badgeEl) badgeEl.innerText = remaining + " Antrean";
        showToast("✓ Foto ditambahkan ke antrean (" + remaining + " foto antre)");
      } else {
        updateDownloadWidget(15, "Menyiapkan Kenangan Berbingkai...", (photo.name || "Foto") + " • Masuk antrean", false);
        processNextDownloadQueue();
      }
    }

    function processNextDownloadQueue() {
      if (downloadQueue.items.length === 0) {
        downloadQueue.isProcessing = false;
        downloadQueue.currentPhoto = null;
        return;
      }

      downloadQueue.isProcessing = true;
      const photo = downloadQueue.items.shift();
      downloadQueue.currentPhoto = photo;
      const rawFrameConfig = state.activeConfig.FRAME_IMAGE_URL ? state.activeConfig.FRAME_IMAGE_URL.trim() : "";
      const frameUrl = normalizeDriveImageUrl(rawFrameConfig);

      if (!frameUrl) {
        processDirectDownloadTask(photo);
        return;
      }

      const remaining = downloadQueue.items.length + 1;
      const queueSuffix = remaining > 1 ? (" (Antrean: " + remaining + ")") : "";
      updateDownloadWidget(30, "Memuat Foto & Bingkai Kualitas Penuh...", (photo.name || "Foto") + " • Resolusi Asli" + queueSuffix, false);

      function prepareCanvasSource(urlOrId, callback, errCallback) {
        if (!urlOrId) { errCallback(); return; }
        if (urlOrId.startsWith("data:")) {
          const img = new Image();
          img.onload = function() { callback(img); };
          img.onerror = errCallback;
          img.src = urlOrId;
          return;
        }

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function() { callback(img); };
        img.onerror = function() {
          callBackend("getImageBase64", { fileId: urlOrId }, function(res) {
            if (res && res.success && res.dataUrl) {
              const b64Img = new Image();
              b64Img.onload = function() { callback(b64Img); };
              b64Img.onerror = errCallback;
              b64Img.src = res.dataUrl;
            } else {
              errCallback();
            }
          }, errCallback);
        };
        img.src = urlOrId;
      }

      // Prioritaskan downloadUrl (berkas kamera asli tanpa kompresi pratinjau)
      const photoSrc = photo.downloadUrl || photo.highResUrl || photo.thumbnailUrl;
      const photoIdOrSrc = photo.id || photoSrc;

      prepareCanvasSource(photoIdOrSrc, function(photoImg) {
        updateDownloadWidget(55, "Menggabungkan Foto Beresolusi Penuh...", (photo.name || "Foto") + " • Menjaga Ukuran Asli", false);

        prepareCanvasSource(frameUrl, function(frameImg) {
          try {
            const fw = frameImg.naturalWidth || 2400;
            const fh = frameImg.naturalHeight || 1600;
            const scanMax = 500;
            const scanScale = Math.min(1, scanMax / Math.max(fw, fh));
            const scanW = Math.max(1, Math.round(fw * scanScale));
            const scanH = Math.max(1, Math.round(fh * scanScale));

            const scanCanvas = document.createElement("canvas");
            scanCanvas.width = scanW;
            scanCanvas.height = scanH;
            const scanCtx = scanCanvas.getContext("2d");
            scanCtx.drawImage(frameImg, 0, 0, scanW, scanH);
            const scanData = scanCtx.getImageData(0, 0, scanW, scanH).data;

            let minX = scanW, minY = scanH, maxX = -1, maxY = -1;
            let transparentCount = 0;

            for (let y = 0; y < scanH; y++) {
              for (let x = 0; x < scanW; x++) {
                const alpha = scanData[(y * scanW + x) * 4 + 3];
                if (alpha < 80) {
                  transparentCount++;
                  if (x < minX) minX = x;
                  if (x > maxX) maxX = x;
                  if (y < minY) minY = y;
                  if (y > maxY) maxY = y;
                }
              }
            }

            let cutoutX, cutoutY, cutoutW, cutoutH;
            if (transparentCount > (scanW * scanH * 0.05) && maxX > minX && maxY > minY) {
              cutoutX = Math.round(minX / scanScale);
              cutoutY = Math.round(minY / scanScale);
              cutoutW = Math.round((maxX - minX + 1) / scanScale);
              cutoutH = Math.round((maxY - minY + 1) / scanScale);
            } else {
              cutoutX = 0;
              cutoutY = 0;
              cutoutW = fw;
              cutoutH = fh;
            }

            // DIMENSI ASLI FOTO (pw, ph)
            const pw = photoImg.naturalWidth || photoImg.width || 1920;
            const ph = photoImg.naturalHeight || photoImg.height || 1080;

            // FAKTOR SKALA DINAMIS: Pastikan kanvas SELALU mengikuti resolusi penuh asli foto (tanpa downscale/penurunan ukuran file)
            const scale = Math.max(1, pw / cutoutW, ph / cutoutH);
            const targetW = Math.round(fw * scale);
            const targetH = Math.round(fh * scale);

            const canvas = document.createElement("canvas");
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext("2d");
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            // Skalakan batas cutout jendela transparan
            const scaledCutoutX = Math.round(cutoutX * scale);
            const scaledCutoutY = Math.round(cutoutY * scale);
            const scaledCutoutW = Math.round(cutoutW * scale);
            const scaledCutoutH = Math.round(cutoutH * scale);

            const photoAspect = pw / ph;
            const cutoutAspect = scaledCutoutW / scaledCutoutH;

            let drawX = scaledCutoutX;
            let drawY = scaledCutoutY;
            let drawW = scaledCutoutW;
            let drawH = scaledCutoutH;

            if (Math.abs(photoAspect - cutoutAspect) < 0.05) {
              drawX = scaledCutoutX;
              drawY = scaledCutoutY;
              drawW = scaledCutoutW;
              drawH = scaledCutoutH;
            } else if (photoAspect > cutoutAspect) {
              drawW = scaledCutoutW;
              drawH = scaledCutoutW / photoAspect;
              drawX = scaledCutoutX;
              drawY = scaledCutoutY + (scaledCutoutH - drawH) / 2;
            } else {
              drawH = scaledCutoutH;
              drawW = scaledCutoutH * photoAspect;
              drawY = scaledCutoutY;
              drawX = scaledCutoutX + (scaledCutoutW - drawW) / 2;
            }

            // 1. Gambar latar belakang putih
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, targetW, targetH);

            // 2. Gambar foto asli dengan resolusi penuh 100% tanpa kompresi/downscaling
            ctx.drawImage(photoImg, drawX, drawY, drawW, drawH);

            // 3. Gambar bingkai PNG di atasnya dengan resolusi ultra-tinggi yang tajam
            ctx.drawImage(frameImg, 0, 0, targetW, targetH);

            updateDownloadWidget(85, "Menyimpan ke Memori Perangkat...", (photo.name || "Foto") + " • Kualitas Asli", false);

            // 4. Ekspor ke Blob kualitas ultra-tinggi 0.98 agar ukuran berkas setara asli (~1.9MB - 2.8MB)
            canvas.toBlob(function(blob) {
              if (blob) {
                const cleanName = (photo.rawName || photo.name || "wedding-photo").replace(/\.[^/.]+$/, "");
                saveBlobToDevice(blob, cleanName + "-berbingkai.jpg");
                const hasMore = downloadQueue.items.length > 0;
                if (hasMore) {
                  updateDownloadWidget(100, "✓ Foto Tersimpan! Melanjutkan antrean...", (cleanName + "-berbingkai.jpg"), false);
                  showToast("✓ Foto tersimpan! Memproses antrean berikutnya (" + downloadQueue.items.length + " tersisa)...");
                  setTimeout(processNextDownloadQueue, 500);
                } else {
                  downloadQueue.isProcessing = false;
                  downloadQueue.currentPhoto = null;
                  updateDownloadWidget(100, "✓ Berhasil Disimpan!", cleanName + "-berbingkai.jpg", true);
                  showToast("✓ Foto berbingkai berhasil tersimpan ke perangkat!");
                }
              } else {
                processDirectDownloadTask(photo);
              }
            }, "image/jpeg", 0.98);

          } catch (eCanvas) {
            console.warn("Canvas compositing error, fallback to direct download:", eCanvas);
            processDirectDownloadTask(photo);
          }
        }, function() {
          processDirectDownloadTask(photo);
        });
      }, function() {
        processDirectDownloadTask(photo);
      });
    }

    function processDirectDownloadTask(photo) {
      const cleanName = (photo.rawName || photo.name || "wedding-photo").replace(/\.[^/.]+$/, "");
      const fileName = cleanName + ".jpg";
      const directUrl = photo.downloadUrl || photo.highResUrl || photo.thumbnailUrl;

      updateDownloadWidget(60, "Mengunduh Foto Asli Langsung...", fileName, false);

      fetch(directUrl)
        .then(function(res) {
          if (!res.ok) throw new Error("HTTP error " + res.status);
          return res.blob();
        })
        .then(function(blob) {
          saveBlobToDevice(blob, fileName);
          const hasMore = downloadQueue.items.length > 0;
          if (hasMore) {
            updateDownloadWidget(100, "✓ Foto Tersimpan! Melanjutkan antrean...", fileName, false);
            showToast("✓ Foto tersimpan! Memproses antrean berikutnya (" + downloadQueue.items.length + " tersisa)...");
            setTimeout(processNextDownloadQueue, 500);
          } else {
            downloadQueue.isProcessing = false;
            downloadQueue.currentPhoto = null;
            updateDownloadWidget(100, "✓ Berhasil Disimpan!", fileName, true);
            showToast("✓ Foto asli berhasil tersimpan ke perangkat!");
          }
        })
        .catch(function() {
          if (photo.id && (state.gasApiUrl || (typeof google !== 'undefined' && google.script))) {
            callBackend("getImageBase64", { fileId: photo.id }, function(res) {
              if (res && res.success && res.dataUrl) {
                const parts = res.dataUrl.split(",");
                const byteCharacters = atob(parts[1]);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: res.contentType || "image/jpeg" });
                saveBlobToDevice(blob, fileName);
                const hasMore = downloadQueue.items.length > 0;
                if (hasMore) {
                  updateDownloadWidget(100, "✓ Foto Tersimpan! Melanjutkan antrean...", fileName, false);
                  showToast("✓ Foto tersimpan! Memproses antrean berikutnya (" + downloadQueue.items.length + " tersisa)...");
                  setTimeout(processNextDownloadQueue, 500);
                } else {
                  downloadQueue.isProcessing = false;
                  downloadQueue.currentPhoto = null;
                  updateDownloadWidget(100, "✓ Berhasil Disimpan!", fileName, true);
                  showToast("✓ Foto asli berhasil tersimpan ke perangkat!");
                }
              } else {
                fallbackSaveLink(directUrl, fileName);
              }
            }, function() {
              fallbackSaveLink(directUrl, fileName);
            });
          } else {
            fallbackSaveLink(directUrl, fileName);
          }
        });
    }

    function triggerDirectDownload(photo) {
      if (!photo) return;
      const isAlreadyQueued = downloadQueue.items.some(function(item) {
        return (item.id && photo.id && item.id === photo.id) || (item.name && photo.name && item.name === photo.name);
      });
      if (isAlreadyQueued) {
        showToast("Foto ini sudah ada dalam antrean unduh.");
        return;
      }
      downloadQueue.items.push(photo);
      const remaining = downloadQueue.items.length + (downloadQueue.isProcessing ? 1 : 0);
      if (downloadQueue.isProcessing) {
        const badgeEl = document.getElementById("dpwBadge");
        if (badgeEl) badgeEl.innerText = remaining + " Antrean";
        showToast("✓ Foto ditambahkan ke antrean (" + remaining + " foto antre)");
      } else {
        updateDownloadWidget(20, "Mengunduh Foto Asli...", photo.name || "Foto", false);
        processNextDownloadQueue();
      }
    }

    function saveBlobToDevice(blob, fileName) {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function() { URL.revokeObjectURL(blobUrl); }, 10000);
    }

    function fallbackSaveLink(url, fileName) {
      resetDownloadButton();
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast("Menyimpan foto...");
      const hasMore = downloadQueue.items.length > 0;
      if (hasMore) {
        setTimeout(processNextDownloadQueue, 500);
      } else {
        downloadQueue.isProcessing = false;
        downloadQueue.currentPhoto = null;
        updateDownloadWidget(100, "✓ Berhasil Disimpan!", fileName, true);
      }
    }

    function resetDownloadButton() {
      const downloadBtn = document.getElementById("lightboxDownloadBtn");
      const btnLabel = document.getElementById("downloadBtnLabel");
      if (downloadBtn && btnLabel) {
        downloadBtn.disabled = false;
        const hasFrame = state.activeConfig.FRAME_IMAGE_URL && state.activeConfig.FRAME_IMAGE_URL.trim();
        btnLabel.innerText = hasFrame ? "✨ Simpan Kenangan Berbingkai" : "Simpan Foto Asli";
      }
    }

    function showToast(message) {
      const container = document.getElementById("toastContainer");
      const toast = document.createElement("div");
      toast.className = "toast";
      toast.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 14 14"></polyline>
        </svg>
        <span>${escapeHtml(message)}</span>
      `;
      container.appendChild(toast);

      setTimeout(function() { toast.classList.add("show"); }, 50);
      setTimeout(function() {
        toast.classList.remove("show");
        setTimeout(function() { toast.remove(); }, 300);
      }, 3500);
    }

    /* ==========================================================================
       LIGHTBOX LOGIC: SHARP RESOLUTION & INTERACTIVE ZOOM ENGINE
       ========================================================================== */
    function getSharpPreviewUrl(photo) {
      if (!photo) return "";
      // 1. Jika video kingphotobooth
      if (photo.isVideo && photo.videoUrl) return photo.videoUrl;
      // 2. Jika foto kingphotobooth
      if (photo.isKing && photo.previewUrl) return photo.previewUrl;

      // 3. Jika Google Drive file ID: gunakan lh3 w3200 resolusi penuh tanpa kompresi buram
      const raw = photo.highResUrl || photo.previewUrl || photo.thumbnailUrl || photo.id || "";
      const match = String(raw).match(/\/d\/([a-zA-Z0-9_\-]+)/) || 
                    String(raw).match(/id=([a-zA-Z0-9_\-]+)/) || 
                    (photo.id && /^[a-zA-Z0-9_\-]{20,}$/.test(photo.id) ? [null, photo.id] : null);
      if (match && match[1]) {
        return "https://lh3.googleusercontent.com/d/" + match[1] + "=w3200";
      }

      // 4. Jika Google Photos: gunakan w3200 resolusi tajam
      if (photo.previewUrl && photo.previewUrl.includes("googleusercontent.com/pw/")) {
        const base = photo.previewUrl.replace(/=[^/]*$/, "");
        return base + "=w3200";
      }

      return photo.highResUrl || photo.previewUrl || photo.thumbnailUrl || "";
    }

    const lightboxZoom = {
      scale: 1,
      minScale: 1,
      maxScale: 4,
      panX: 0,
      panY: 0,
      isDragging: false,
      startX: 0,
      startY: 0,
      lastTapTime: 0,
      eventsInitialized: false
    };

    function resetLightboxZoom() {
      lightboxZoom.scale = 1;
      lightboxZoom.panX = 0;
      lightboxZoom.panY = 0;
      lightboxZoom.isDragging = false;
      applyLightboxZoom();
    }

    function zoomLightbox(delta) {
      const newScale = Math.min(lightboxZoom.maxScale, Math.max(lightboxZoom.minScale, lightboxZoom.scale + delta));
      lightboxZoom.scale = Math.round(newScale * 10) / 10;
      if (lightboxZoom.scale <= 1) {
        lightboxZoom.scale = 1;
        lightboxZoom.panX = 0;
        lightboxZoom.panY = 0;
      }
      applyLightboxZoom();
    }

    function applyLightboxZoom() {
      const img = document.getElementById("lightboxImg");
      const wrapper = document.getElementById("lightboxImgWrapper");

      if (wrapper) {
        if (lightboxZoom.scale > 1.05) {
          wrapper.classList.add("is-zoomed");
          if (lightboxZoom.isDragging) wrapper.classList.add("is-dragging");
          else wrapper.classList.remove("is-dragging");
        } else {
          wrapper.classList.remove("is-zoomed", "is-dragging");
        }
      }

      if (img) {
        if (lightboxZoom.scale <= 1) {
          img.style.transform = "none";
        } else {
          img.style.transform = "translate(" + lightboxZoom.panX + "px, " + lightboxZoom.panY + "px) scale(" + lightboxZoom.scale + ")";
        }
      }
    }

    function initLightboxZoomEvents() {
      if (lightboxZoom.eventsInitialized) return;
      const wrapper = document.getElementById("lightboxImgWrapper");
      if (!wrapper) return;
      lightboxZoom.eventsInitialized = true;

      // Mouse Wheel Zoom
      wrapper.addEventListener("wheel", function(e) {
        const vid = document.getElementById("lightboxVideo");
        if (vid && vid.style.display !== "none") return;
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.35 : -0.35;
        zoomLightbox(delta);
      }, { passive: false });

      // Double Click Zoom
      wrapper.addEventListener("dblclick", function(e) {
        const vid = document.getElementById("lightboxVideo");
        if (vid && vid.style.display !== "none") return;
        e.preventDefault();
        if (lightboxZoom.scale > 1.05) {
          resetLightboxZoom();
        } else {
          lightboxZoom.scale = 2.5;
          lightboxZoom.panX = 0;
          lightboxZoom.panY = 0;
          applyLightboxZoom();
        }
      });

      // Mouse Drag Pan
      wrapper.addEventListener("mousedown", function(e) {
        if (lightboxZoom.scale <= 1.05) return;
        e.preventDefault();
        lightboxZoom.isDragging = true;
        lightboxZoom.startX = e.clientX - lightboxZoom.panX;
        lightboxZoom.startY = e.clientY - lightboxZoom.panY;
        applyLightboxZoom();
      });

      window.addEventListener("mousemove", function(e) {
        if (!lightboxZoom.isDragging) return;
        lightboxZoom.panX = e.clientX - lightboxZoom.startX;
        lightboxZoom.panY = e.clientY - lightboxZoom.startY;
        applyLightboxZoom();
      });

      window.addEventListener("mouseup", function() {
        if (lightboxZoom.isDragging) {
          lightboxZoom.isDragging = false;
          applyLightboxZoom();
        }
      });

      // Pinch-to-Zoom dengan 2 Jari, Double-Tap & Drag Pan
      let initialPinchDist = 0;
      let initialScale = 1;
      let isPinching = false;

      wrapper.addEventListener("touchstart", function(e) {
        const vid = document.getElementById("lightboxVideo");
        if (vid && vid.style.display !== "none") return;

        // Deteksi Gesture 2 Jari (Pinch-to-Zoom)
        if (e.touches.length === 2) {
          isPinching = true;
          lightboxZoom.isDragging = false;
          initialPinchDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          initialScale = lightboxZoom.scale;
          return;
        }

        const now = Date.now();
        if (e.touches.length === 1) {
          isPinching = false;
          if (now - lightboxZoom.lastTapTime < 320) {
            e.preventDefault();
            if (lightboxZoom.scale > 1.05) {
              resetLightboxZoom();
            } else {
              lightboxZoom.scale = 2.5;
              lightboxZoom.panX = 0;
              lightboxZoom.panY = 0;
              applyLightboxZoom();
            }
            lightboxZoom.lastTapTime = 0;
            return;
          }
          lightboxZoom.lastTapTime = now;

          if (lightboxZoom.scale > 1.05) {
            lightboxZoom.isDragging = true;
            lightboxZoom.startX = e.touches[0].clientX - lightboxZoom.panX;
            lightboxZoom.startY = e.touches[0].clientY - lightboxZoom.panY;
          }
        }
      }, { passive: false });

      wrapper.addEventListener("touchmove", function(e) {
        const vid = document.getElementById("lightboxVideo");
        if (vid && vid.style.display !== "none") return;

        // Eksekusi Pinch-to-Zoom
        if (e.touches.length === 2 && isPinching && initialPinchDist > 0) {
          e.preventDefault();
          const currentDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          const factor = currentDist / initialPinchDist;
          let targetScale = initialScale * factor;
          targetScale = Math.min(lightboxZoom.maxScale, Math.max(lightboxZoom.minScale, targetScale));
          lightboxZoom.scale = Math.round(targetScale * 100) / 100;
          if (lightboxZoom.scale <= 1) {
            lightboxZoom.scale = 1;
            lightboxZoom.panX = 0;
            lightboxZoom.panY = 0;
          }
          applyLightboxZoom();
          return;
        }

        // Eksekusi Drag Pan 1 Jari saat Zoom
        if (lightboxZoom.isDragging && e.touches.length === 1 && lightboxZoom.scale > 1.05) {
          e.preventDefault();
          lightboxZoom.panX = e.touches[0].clientX - lightboxZoom.startX;
          lightboxZoom.panY = e.touches[0].clientY - lightboxZoom.startY;
          applyLightboxZoom();
        }
      }, { passive: false });

      wrapper.addEventListener("touchend", function(e) {
        if (e.touches.length < 2) {
          isPinching = false;
          initialPinchDist = 0;
        }
        if (e.touches.length === 0) {
          lightboxZoom.isDragging = false;
          applyLightboxZoom();
        }
      });
    }

    function openLightbox(index) {
      if (!state.filteredPhotos[index]) return;
      state.currentLightboxIndex = index;

      const modal = document.getElementById("lightbox");
      modal.classList.add("active");
      document.body.style.overflow = "hidden";

      initLightboxZoomEvents();
      resetLightboxZoom();
      resetDownloadButton();
      updateLightboxContent();
    }

    function closeLightbox() {
      const modal = document.getElementById("lightbox");
      modal.classList.remove("active");
      document.body.style.overflow = "";

      const vid = document.getElementById("lightboxVideo");
      if (vid) {
        vid.pause();
        vid.src = "";
        vid.style.display = "none";
      }
      resetLightboxZoom();
      resetDownloadButton();
    }

    function navigateLightbox(direction) {
      let newIndex = state.currentLightboxIndex + direction;
      if (newIndex < 0) {
        newIndex = state.filteredPhotos.length - 1;
      } else if (newIndex >= state.filteredPhotos.length) {
        newIndex = 0;
      }
      state.currentLightboxIndex = newIndex;
      resetLightboxZoom();
      updateLightboxContent();
    }

    function updateLightboxContent() {
      const photo = state.filteredPhotos[state.currentLightboxIndex];
      if (!photo) return;

      document.getElementById("lightboxCounter").innerText = 
        `FOTO ${state.currentLightboxIndex + 1} DARI ${state.filteredPhotos.length}`;
      document.getElementById("lightboxTitle").innerText = photo.name;
      
      const sharpUrl = getSharpPreviewUrl(photo);
      const img = document.getElementById("lightboxImg");
      const video = document.getElementById("lightboxVideo");
      const zoomToolbar = document.getElementById("lightboxZoomToolbar");
      const btn = document.getElementById("lightboxDownloadBtn");
      const btnLabel = document.getElementById("downloadBtnLabel");

      resetLightboxZoom();
      resetDownloadButton();

      if (photo.isVideo) {
        if (img) img.style.display = "none";
        if (zoomToolbar) zoomToolbar.style.display = "none";
        if (video) {
          video.style.display = "block";
          video.src = photo.videoUrl || photo.previewUrl || sharpUrl;
          video.play().catch(function(){});
        }
        if (btnLabel) btnLabel.innerText = "⬇️ Unduh Video Asli Photobooth";
        if (btn) {
          btn.onclick = function() {
            downloadPhotoboothOriginal(photo);
          };
        }
      } else {
        if (video) {
          video.pause();
          video.style.display = "none";
          video.src = "";
        }
        if (img) {
          img.style.display = "block";
          img.style.opacity = "1";
          img.style.filter = "none";
          img.style.backgroundColor = "transparent";
          img.src = sharpUrl;
        }
        if (zoomToolbar) zoomToolbar.style.display = "inline-flex";

        const isPhotobooth = photo && (
          Boolean(photo.isVideo) ||
          Boolean(photo.isKing) ||
          Boolean(photo.isPhotobooth) ||
          (photo.category && photo.category.toLowerCase().includes("photobooth")) ||
          (state.activeCategory && state.activeCategory.toLowerCase().includes("photobooth")) ||
          (photo.downloadUrl && (photo.downloadUrl.includes("kingphotobooth.co") || photo.downloadUrl.includes("fotoshare.co") || photo.downloadUrl.includes("photos.google.com"))) ||
          (photo.previewUrl && (photo.previewUrl.includes("kingphotobooth.co") || photo.previewUrl.includes("fotoshare.co") || photo.previewUrl.includes("photos.google.com")))
        );

        if (isPhotobooth) {
          if (btnLabel) btnLabel.innerText = "⬇️ Unduh Foto Asli (Ukuran Penuh)";
          if (btn) {
            btn.onclick = function() {
              downloadPhotoboothOriginal(photo);
            };
          }
        } else {
          // Semua kategori momen lainnya mengikuti settingan kategori utama (berbingkai)
          if (btnLabel) btnLabel.innerText = "✨ Simpan Kenangan Berbingkai";
          if (btn) {
            btn.onclick = function() {
              downloadCurrentPhotoWithFrame();
            };
          }
        }
      }
    }

    function downloadPhotoboothOriginal(photo) {
      if (!photo) return;
      const isVideo = Boolean(photo.isVideo);
      const rawUrl = photo.downloadUrl || photo.videoUrl || photo.highResUrl || photo.previewUrl || photo.thumbnailUrl || photo.img;
      if (!rawUrl) return;
      const ext = isVideo ? ".mp4" : ".jpg";
      const cleanName = (photo.name || (isVideo ? "Video_Photobooth" : "Photobooth")).replace(/[\/\\]/g, "_");
      const fileName = cleanName.endsWith(ext) ? cleanName : (cleanName + ext);

      showToast(isVideo ? "🎬 Mengunduh video asli tanpa kompresi..." : "📸 Mengunduh foto asli kualitas penuh...");

      const proxyUrl = "/api/download-proxy?url=" + encodeURIComponent(rawUrl) + "&filename=" + encodeURIComponent(fileName);

      // 1. Ambil file asli via server proxy (mengabaikan CORS & tanpa kompresi)
      fetch(proxyUrl)
        .then(function(res) {
          if (!res.ok) throw new Error("Proxy HTTP " + res.status);
          return res.blob();
        })
        .then(function(blob) {
          triggerSilentBlobDownload(blob, fileName, isVideo);
        })
        .catch(function() {
          // 2. Coba fetch langsung jika domain asal mendukung CORS
          fetch(rawUrl)
            .then(function(res) {
              if (!res.ok) throw new Error("Direct HTTP " + res.status);
              return res.blob();
            })
            .then(function(blob) {
              triggerSilentBlobDownload(blob, fileName, isVideo);
            })
            .catch(function() {
              // 3. Fallback hening ke invisible hidden iframe (TIDAK PERNAH BUKA WINDOW / TAB BARU)
              triggerSilentIframeDownload(proxyUrl, isVideo);
              setTimeout(function() {
                const testFrame = document.getElementById("silentDownloadFrame");
                if (testFrame && !testFrame.src.includes(encodeURIComponent(rawUrl))) {
                  triggerSilentIframeDownload(rawUrl, isVideo);
                }
              }, 400);
            });
        });
    }

    function startSlideshowFromCurrent() {
      closeLightbox();
      openSlideshow(state.currentLightboxIndex);
    }

    /* ==========================================================================
       STAGE SLIDESHOW LOGIC (MODE PANGGUNG)
       ========================================================================== */
    function openSlideshow(startIndex) {
      if (state.filteredPhotos.length === 0) return;
      state.currentSlideIndex = startIndex || 0;

      const overlay = document.getElementById("slideshowOverlay");
      overlay.classList.add("active");
      document.body.style.overflow = "hidden";

      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(function() {});
      }

      state.isSlideshowPlaying = true;
      updatePlayPauseIcons();
      showSlide(state.currentSlideIndex);
      startSlideshowLoop();
    }

    function closeSlideshow() {
      const overlay = document.getElementById("slideshowOverlay");
      overlay.classList.remove("active");
      document.body.style.overflow = "";

      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(function() {});
      }

      clearInterval(state.slideshowTimer);
      clearInterval(state.slideshowProgressTimer);
    }

    function showSlide(index) {
      const photo = state.filteredPhotos[index];
      if (!photo) return;

      const eventDate = state.activeConfig.EVENT_DATE || "14 November 2026";
      const eventVenue = state.activeConfig.EVENT_VENUE || "Upperhills Convention Centre, Makassar";
      document.getElementById("slideshowCategory").innerText = eventDate + " • " + eventVenue + " • " + photo.category;

      const imgA = document.getElementById("slideshowImgA");
      const imgB = document.getElementById("slideshowImgB");

      if (state.activeSlideTarget === 'A') {
        imgB.src = photo.highResUrl || photo.thumbnailUrl;
        imgB.classList.add("visible");
        imgA.classList.remove("visible");
        state.activeSlideTarget = 'B';
      } else {
        imgA.src = photo.highResUrl || photo.thumbnailUrl;
        imgA.classList.add("visible");
        imgB.classList.remove("visible");
        state.activeSlideTarget = 'A';
      }

      resetProgressBar();
    }

    function nextSlide() {
      state.currentSlideIndex = (state.currentSlideIndex + 1) % state.filteredPhotos.length;
      showSlide(state.currentSlideIndex);
    }

    function prevSlide() {
      state.currentSlideIndex = (state.currentSlideIndex - 1 + state.filteredPhotos.length) % state.filteredPhotos.length;
      showSlide(state.currentSlideIndex);
    }

    function togglePlayPause() {
      state.isSlideshowPlaying = !state.isSlideshowPlaying;
      updatePlayPauseIcons();

      if (state.isSlideshowPlaying) {
        startSlideshowLoop();
      } else {
        clearInterval(state.slideshowTimer);
        clearInterval(state.slideshowProgressTimer);
      }
    }

    function updatePlayPauseIcons() {
      const playIcon = document.getElementById("playIcon");
      const pauseIcon = document.getElementById("pauseIcon");
      if (state.isSlideshowPlaying) {
        playIcon.style.display = "none";
        pauseIcon.style.display = "block";
      } else {
        playIcon.style.display = "block";
        pauseIcon.style.display = "none";
      }
    }

    function startSlideshowLoop() {
      clearInterval(state.slideshowTimer);
      state.slideshowTimer = setInterval(function() {
        if (state.isSlideshowPlaying) {
          nextSlide();
        }
      }, state.intervalMs);

      resetProgressBar();
    }

    function resetProgressBar() {
      clearInterval(state.slideshowProgressTimer);
      const bar = document.getElementById("slideshowProgress");
      bar.style.width = "0%";

      if (!state.isSlideshowPlaying) return;

      let progress = 0;
      const step = 50;
      const increment = (step / state.intervalMs) * 100;

      state.slideshowProgressTimer = setInterval(function() {
        progress += increment;
        if (progress >= 100) {
          progress = 100;
          clearInterval(state.slideshowProgressTimer);
        }
        bar.style.width = progress + "%";
      }, step);
    }

    /* ==========================================================================
       KEYBOARD & TOUCH NAVIGATION
       ========================================================================== */
    function setupKeyboardNav() {
      window.addEventListener("keydown", function(e) {
        const lightboxActive = document.getElementById("lightbox").classList.contains("active");
        const slideshowActive = document.getElementById("slideshowOverlay").classList.contains("active");
        const adminLoginActive = document.getElementById("adminLoginModal").classList.contains("active");
        const adminSettingsActive = document.getElementById("adminSettingsModal").classList.contains("active");

        if (e.key === "Escape") {
          if (adminLoginActive) closeAdminLoginModal();
          else if (adminSettingsActive) closeAdminSettingsModal();
          else if (slideshowActive) closeSlideshow();
          else if (lightboxActive) closeLightbox();
        } else if (e.key === "ArrowRight") {
          if (slideshowActive) nextSlide();
          else if (lightboxActive) navigateLightbox(1);
        } else if (e.key === "ArrowLeft") {
          if (slideshowActive) prevSlide();
          else if (lightboxActive) navigateLightbox(-1);
        } else if (e.key === " ") {
          if (slideshowActive) {
            e.preventDefault();
            togglePlayPause();
          }
        }
      });
    }

    function setupTouchSwipe() {
      const lightboxBody = document.getElementById("lightboxBody");
      if (!lightboxBody) return;

      lightboxBody.addEventListener("touchstart", function(e) {
        if (e.changedTouches && e.changedTouches.length > 0) {
          touchStartX = e.changedTouches[0].clientX || e.changedTouches[0].screenX;
          touchStartY = e.changedTouches[0].clientY || e.changedTouches[0].screenY;
        }
      }, { passive: true });

      lightboxBody.addEventListener("touchend", function(e) {
        if (e.changedTouches && e.changedTouches.length > 0) {
          touchEndX = e.changedTouches[0].clientX || e.changedTouches[0].screenX;
          touchEndY = e.changedTouches[0].clientY || e.changedTouches[0].screenY;
          handleSwipeGesture();
        }
      }, { passive: true });
    }

    function handleSwipeGesture() {
      // Jika sedang zoom aktif (> 1), jangan pindah foto via swipe agar user bebas panning
      if (typeof lightboxZoom !== 'undefined' && lightboxZoom.scale > 1.05) {
        return;
      }

      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;
      const absX = Math.abs(diffX);
      const absY = Math.abs(diffY);

      // Proteksi Ketat Swipe Up / Down:
      // Jika gerakan dominan vertikal (swipe up/down) atau ada pergerakan vertikal signifikan, JANGAN PINDAH FOTO!
      if (absY >= absX || absY > 50) {
        return;
      }

      // Hanya pindahkan foto jika murni swipe horizontal yang jelas (minimal 65px dan rasio absX > 2 * absY)
      if (absX >= 65 && absX > 2 * absY) {
        if (diffX < 0) {
          navigateLightbox(1);
        } else {
          navigateLightbox(-1);
        }
      }
    }

    function escapeHtml(str) {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function loadFallbackData(reason) {
      const demoNotice = document.getElementById("demoNotice");
      if (demoNotice) demoNotice.style.display = "none";
      const liveEventName = state.activeConfig.EVENT_NAME || GLOBAL_CONFIG.EVENT_NAME;
      const liveEventDate = state.activeConfig.EVENT_DATE || GLOBAL_CONFIG.EVENT_DATE;
      const liveEventVenue = state.activeConfig.EVENT_VENUE || GLOBAL_CONFIG.EVENT_VENUE;

      handleGalleryResponse({
        isDemo: false,
        config: {
          EVENT_NAME: liveEventName,
          COUPLE_NAME: liveEventName,
          EVENT_DATE: liveEventDate,
          EVENT_VENUE: liveEventVenue,
          SUBTITLE: "The Wedding Gallery & Precious Memories",
          WELCOME_MESSAGE: "Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.",
          DRIVE_FOLDER_ID: state.activeConfig.DRIVE_FOLDER_ID || GLOBAL_CONFIG.DRIVE_FOLDER_ID || "",
          SLIDESHOW_INTERVAL_SEC: 4,
          FRAME_IMAGE_URL: state.activeConfig.FRAME_IMAGE_URL || GLOBAL_CONFIG.FRAME_IMAGE_URL || "",
          SPREADSHEET_ID: state.activeConfig.SPREADSHEET_ID || GLOBAL_CONFIG.SPREADSHEET_ID || "",
          SPREADSHEET_URL: state.activeConfig.SPREADSHEET_URL || GLOBAL_CONFIG.SPREADSHEET_URL || ""
        },
        categories: ["Semua Foto"],
        photos: []
      }, false);
    }