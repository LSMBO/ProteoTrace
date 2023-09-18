from Proline import Proline
import pickle
import argparse
import random, string

parser = argparse.ArgumentParser()
parser.add_argument('-r', help='Proline excel output file', required=True)
parser.add_argument('-f', help='Database used in the identification search', required=True)
#parser.add_argument('-id', help='Protein id', required=False, action='append')
#parser.add_argument('-o', help='Output file name', required=False)
args = parser.parse_args()

excel_file_path = args.r
fasta_file = args.f
random_suffix = ''.join(random.choices(string.digits, k=4))
output_file_pkl = f"tmp/Proline_proteotrace_{random_suffix}.pkl"
output_file_txt = f"tmp/Proline_proteotrace_protein_list_{random_suffix}.txt"

proline = Proline(excel_file_path, fasta_file)
# Sauvegarder l'objet proline dans un fichier pkl en utilisant pickle
with open(output_file_pkl, 'wb') as pkl_file:
    pickle.dump(proline, pkl_file)
    
protein_ids_identified = [protein.id for protein in proline.proteins]

database = proline.sequences
protein_ids_all = [sequence["id"] for sequence in database]
protein_description_all = [sequence["description"] for sequence in database]

# Ouvrez le fichier texte en écriture
with open(output_file_txt, 'w') as output_file:
    # Écrivez chaque identifiant de protéine sur une ligne distincte dans le fichier
    for protein_description in protein_description_all:
        output_file.write(f"{protein_description}\n")

print(f"RUN_ID={random_suffix}")

# Pour charger l'objet proline depuis le fichier pkl
# with open(output_file_pkl, 'rb') as pkl_file:
#     loaded_proline = pickle.load(pkl_file)



# for prot_id in protein_id_list:
#     for protein in proline.proteins:
#         if protein.id == prot_id:
#             protein.get_sequence_coverage(output_file=output_file)
#             #protein.get_coverage_stats()

# print(f"The Proline Proteotrace run is completed. The results are in {output_file}")
    
