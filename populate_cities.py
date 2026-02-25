
import requests
import json

def populate():
    # Mapeamento de Sigla para UUID (obtido do banco)
    map_estados = {
        "AC": "091ef36e-a0dd-4123-9f54-c5683d29e25c",
        "AL": "9d69bdad-e87b-42c9-a8e4-05e9738bf155",
        "AP": "a4a9a37b-a5ab-4370-b4a7-c4f87b253c4f",
        "AM": "8b91ea0b-4697-4af8-8297-d37457b49ed6",
        "BA": "fb7595d8-b111-4f11-86ad-af368418d351",
        "CE": "ddfb07f8-e5e2-42f6-9a13-188a8b69ab9d",
        "DF": "4254ed6f-ece5-4631-82b5-2f9990da2e8c",
        "ES": "e0c9edba-b70a-4d7c-ab24-c64710b0b219",
        "GO": "f85dea49-a84e-4423-8962-13ec5a9a3ac4",
        "MA": "0c3f3b2b-c012-4792-a254-b7f8611bb262",
        "MT": "692d87ab-773c-4641-b817-86d5483cfe87",
        "MS": "61c83497-fc97-49b9-9f6c-9347dfb4d624",
        "MG": "c7ac106c-0cd6-4fa9-8af6-d2edb2f932d3",
        "PA": "df16b8c4-0a83-4eaf-83d5-3a87673b1c52",
        "PB": "524aa82a-0d06-44c1-b9a7-330b97c87ffb",
        "PR": "5e59c936-8391-4207-b47f-00f3dead7b00",
        "PE": "702a5913-6a45-4915-8937-66432570d4d1",
        "PI": "cc0136b1-d482-442b-af01-790e2642bccd",
        "RJ": "44b58a77-13ed-4efe-9b83-c5784bf9cdcf",
        "RN": "a0d7d0be-c894-4dc4-8de5-199dda0a0872",
        "RS": "ff95b1ef-c0fa-4940-b88e-104956209b17",
        "RO": "56ca7500-93b1-44b7-b285-e3407188ef6e",
        "RR": "c4de77c9-b264-4e5d-8caa-3b0866312d52",
        "SC": "4aefcd16-5151-4d0f-a0a5-a2311f6f454d",
        "SP": "f45dd6ca-4937-492a-81ff-a260467ac855",
        "SE": "87d99a37-201f-4e6e-853d-e593b9119a6f",
        "TO": "3ff74c49-521a-4f5c-842b-db4fa9a63439"
    }

    try:
        response = requests.get("https://servicodados.ibge.gov.br/api/v1/localidades/municipios")
        municipios = response.json()
        
        # Limpar cidades existentes para evitar duplicidade ou conflitos se preferir, 
        # mas aqui vamos apenas ignorar se já existirem (ON CONFLICT DO NOTHING)
        
        sql_chunks = []
        current_values = []
        
        for mun in municipios:
            nome = mun['nome'].replace("'", "''")
            sigla_uf = mun['microrregiao']['mesorregiao']['UF']['sigla']
            estado_id = map_estados.get(sigla_uf)
            
            if estado_id:
                current_values.append(f"('{nome}', '{estado_id}')")
            
            if len(current_values) >= 500:
                vals = ",\n".join(current_values)
                sql = f"INSERT INTO cidades (nome, estado_id) VALUES\n{vals}\nON CONFLICT (nome, estado_id) DO NOTHING;"
                sql_chunks.append(sql)
                current_values = []
                
        if current_values:
            vals = ",\n".join(current_values)
            sql = f"INSERT INTO cidades (nome, estado_id) VALUES\n{vals}\nON CONFLICT (nome, estado_id) DO NOTHING;"
            sql_chunks.append(sql)
            
        return sql_chunks
    except Exception as e:
        print(f"Erro: {str(e)}")
        return []

if __name__ == "__main__":
    chunks = populate()
    with open('insert_cities.json', 'w', encoding='utf-8') as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)
    print(f"Sucesso! Gerados {len(chunks)} chunks de SQL.")
