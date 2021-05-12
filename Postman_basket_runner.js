let getAllSectionsIds = (responseJSON, sections) => {
    responseJSON.forEach((section) => {
        sections[section.ID] = section.SECTION_PAGE_PATH
        if (Array.isArray(section.CHILDREN)) {
            getAllSectionsIds(section.CHILDREN, sections)
        }
    })
}
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

pm.sendRequest(
    {
        url: `${pm.collectionVariables.get("host")}/api/v1/catalog/sections?seo_sections=true`,
        method: pm.request.method,
        header: {
            "Authorization": `Bearer ${pm.collectionVariables.get("access_token")}`
        }
    },

    (_, response) => {
        let sections = {}
        getAllSectionsIds(response.json().result, sections)
        const sectionsLength = parseInt(Object.keys(sections).length)
        catalogSectionsErrors = []
        let sectionsCounter = 0
        for (let sectionId in sections) {
            setTimeout(pm.sendRequest(
                {
                    url: `${pm.collectionVariables.get("host")}/api/v1/snippets/vue/catalog?section_id=${sectionId}&seo_link=${sections[sectionId]}`,
                    method: pm.request.method,
                    header: {
                        "Authorization": `Bearer ${pm.collectionVariables.get("access_token")}`
                    }
                },
                (_, response) => {
                    sectionsCounter++
                    if (response.code !== 200) {
                        catalogSectionsErrors.push(sectionId)
                    }
                    if (sectionsCounter >= sectionsLength) {
                        pm.test(request.name, () => pm.expect(catalogSectionsErrors.length).to.eq(0, `Ошибка при получении разделов: ${catalogSectionsErrors.join("\n")}`))
                    }

                }), 600)
        }
    }
)